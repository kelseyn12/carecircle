// Firestore utilities for circle management
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc as firestoreUpdateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  onSnapshot, 
  serverTimestamp,
  Timestamp,
  writeBatch,
  FieldValue
} from 'firebase/firestore';
import { db, functions, storage } from './firebase';
import { ref, deleteObject, listAll } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { Circle, Update, User, Comment } from '../types';
import { handleError, retryOperation } from './errorHandler';
import { addOfflineUpdate, addOfflineComment, addOfflineReaction } from './offlineQueue';
import {
  getCircleEncryptionKey,
  createCircleEncryptionKey,
  encryptText,
  decryptText,
  isEncryptionEnabled,
} from './encryption';

// Collection references
const circlesRef = collection(db, 'circles');
const updatesRef = collection(db, 'updates');
const usersRef = collection(db, 'users');
// Note: invites are read via callable function due to security rules

// Subcollections
const joinRequestsSubcollection = (circleId: string) => collection(doc(circlesRef, circleId), 'joinRequests');
const commentsRef = collection(db, 'comments');

// Circle Management Functions

/**
 * Create a new circle
 */
export const createCircle = async (circleData: {
  title: string;
  ownerId: string;
}): Promise<string> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const docRef = await addDoc(circlesRef, {
      ...circleData,
      ownerIds: [circleData.ownerId], // New: array of owner IDs
      members: [circleData.ownerId], // Owner is automatically a member
      updateAuthors: [circleData.ownerId], // Owner can post updates
      roles: { [circleData.ownerId]: 'owner' }, // Set owner role
      createdAt: serverTimestamp(),
    });
    
    // Increment total circles created counter for the user (prevents gaming the system)
    try {
      const userRef = doc(usersRef, circleData.ownerId);
      const userDoc = await getDoc(userRef);
      const currentCount = userDoc.data()?.totalCirclesCreated || 0;
      await firestoreUpdateDoc(userRef, {
        totalCirclesCreated: currentCount + 1,
      });
    } catch (counterError) {
      console.error('Error updating total circles created counter:', counterError);
      // Don't fail circle creation if counter update fails
    }
    
    // Create encryption key for this circle
    try {
      await createCircleEncryptionKey(docRef.id);
    } catch (encryptionError) {
      console.error('Error creating encryption key for circle:', encryptionError);
      // Don't fail circle creation if encryption key creation fails
      // The circle will work without encryption
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating circle:', error);
    throw new Error('Failed to create circle. Please try again.');
  }
};

/**
 * Get a circle by ID
 */
export const getCircle = async (circleId: string): Promise<Circle | null> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const circleDoc = await getDoc(doc(circlesRef, circleId));
    
    if (!circleDoc.exists()) {
      return null;
    }

    const data = circleDoc.data();
    return {
      id: circleDoc.id,
      title: data.title,
      ownerId: data.ownerId, // Keep for backward compatibility
      ownerIds: data.ownerIds || [data.ownerId], // New: array of owner IDs
      members: data.members || [],
      updateAuthors: data.updateAuthors || [data.ownerId], // New: array of update authors
      roles: data.roles || {},
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Error getting circle:', error);
    throw new Error('Failed to fetch circle. Please try again.');
  }
};

/**
 * Get a user by their ID
 */
export const getUser = async (userId: string): Promise<User | null> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const userDoc = await getDoc(doc(usersRef, userId));
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const data = userDoc.data();
    return {
      id: userDoc.id,
      displayName: data.displayName || 'Unknown User',
      photoURL: data.photoURL,
      expoPushToken: data.expoPushToken,
      createdAt: data.createdAt?.toDate() || new Date(),
      circlesMuted: data.circlesMuted || [],
      lastViewedCircles: Object.fromEntries(
        Object.entries(data.lastViewedCircles || {}).map(([k, v]: any) => [k, v?.toDate ? v.toDate() : new Date(v)])
      ),
    };
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

/**
 * Get all circles for a user (where user is a member)
 */
export const getUserCircles = async (userId: string): Promise<Circle[]> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const q = query(
      circlesRef,
      where('members', 'array-contains', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const circles: Circle[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      circles.push({
        id: doc.id,
        title: data.title,
        ownerId: data.ownerId,
        members: data.members || [],
        ownerIds: data.ownerIds || [data.ownerId],
        updateAuthors: data.updateAuthors || [data.ownerId],
        roles: data.roles || {},
        createdAt: data.createdAt?.toDate() || new Date(),
        lastUpdateAt: data.lastUpdateAt?.toDate ? data.lastUpdateAt.toDate() : undefined,
      });
    });

    // Sort by creation date on the client side
    circles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return circles;
  } catch (error) {
    console.error('Error getting user circles:', error);
    throw new Error('Failed to fetch circles. Please try again.');
  }
};

/**
 * Update circle data
 */
export const updateCircle = async (
  circleId: string, 
  updates: Partial<Pick<Circle, 'title' | 'members'>>
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const circleDoc = doc(circlesRef, circleId);
    await firestoreUpdateDoc(circleDoc, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating circle:', error);
    throw new Error('Failed to update circle. Please try again.');
  }
};

/**
 * Add member to circle
 */
export const addMemberToCircle = async (
  circleId: string, 
  userId: string
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const circleDoc = doc(circlesRef, circleId);
    const circle = await getCircle(circleId);
    
    if (!circle) {
      throw new Error('Circle not found');
    }

    if (circle.members.includes(userId)) {
      throw new Error('User is already a member of this circle');
    }

    await firestoreUpdateDoc(circleDoc, {
      members: [...circle.members, userId],
      [`roles.${userId}`]: 'member', // Set as member role
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error adding member to circle:', error);
    throw new Error('Failed to add member. Please try again.');
  }
};

/**
 * Remove member from circle
 */
export const removeMemberFromCircle = async (
  circleId: string, 
  userId: string
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const circleDoc = doc(circlesRef, circleId);
    const circle = await getCircle(circleId);
    
    if (!circle) {
      throw new Error('Circle not found');
    }

    if (!circle.members.includes(userId)) {
      throw new Error('User is not a member of this circle');
    }

    const updatedMembers = circle.members.filter(id => id !== userId);
    
    await firestoreUpdateDoc(circleDoc, {
      members: updatedMembers,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error removing member from circle:', error);
    throw new Error('Failed to remove member. Please try again.');
  }
};

/**
 * Delete circle
 */
export const deleteCircle = async (circleId: string): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    // TODO: Also delete all updates for this circle
    await deleteDoc(doc(circlesRef, circleId));
  } catch (error) {
    console.error('Error deleting circle:', error);
    throw new Error('Failed to delete circle. Please try again.');
  }
};

/**
 * Check if user is member of circle
 */
export const isUserMemberOfCircle = async (
  circleId: string, 
  userId: string
): Promise<boolean> => {
  try {
    const circle = await getCircle(circleId);
    return circle ? circle.members.includes(userId) : false;
  } catch (error) {
    console.error('Error checking circle membership:', error);
    return false;
  }
};

/**
 * Get user role in circle
 */
export const getUserRoleInCircle = async (
  circleId: string, 
  userId: string
): Promise<'owner' | 'member' | null> => {
  try {
    const circle = await getCircle(circleId);
    if (!circle) return null;
    
    // Check if user is in ownerIds array (new system)
    if (circle.ownerIds?.includes(userId)) {
      return 'owner';
    }
    
    // Check if user is in roles object
    if (circle.roles?.[userId]) {
      return circle.roles[userId] as 'owner' | 'member';
    }
    
    // Fallback for old circles: check if user is ownerId
    if (circle.ownerId === userId) {
      return 'owner';
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

/**
 * Check if user is an owner of the circle
 */
export const isUserOwner = async (
  circleId: string, 
  userId: string
): Promise<boolean> => {
  try {
    const circle = await getCircle(circleId);
    return circle?.ownerIds?.includes(userId) || false;
  } catch (error) {
    console.error('Error checking if user is owner:', error);
    return false;
  }
};

/**
 * Promote member to owner
 */
export const promoteMemberToOwner = async (
  circleId: string, 
  userId: string
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const circle = await getCircle(circleId);
    if (!circle) {
      throw new Error('Circle not found');
    }

    const circleDoc = doc(circlesRef, circleId);
    const updatedOwnerIds = [...(circle.ownerIds || []), userId];
    
    // Ensure owner is in updateAuthors array (owners should always be able to post)
    const updateAuthors = circle.updateAuthors || [];
    const updatedUpdateAuthors = updateAuthors.includes(userId) 
      ? updateAuthors 
      : [...updateAuthors, userId];
    
    await firestoreUpdateDoc(circleDoc, {
      [`roles.${userId}`]: 'owner',
      ownerIds: updatedOwnerIds,
      updateAuthors: updatedUpdateAuthors,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error promoting member:', error);
    throw new Error('Failed to promote member. Please try again.');
  }
};

/**
 * Demote owner to member
 */
export const demoteOwnerToMember = async (
  circleId: string, 
  userId: string
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const circle = await getCircle(circleId);
    if (!circle) {
      throw new Error('Circle not found');
    }

    const circleDoc = doc(circlesRef, circleId);
    const updatedOwnerIds = (circle.ownerIds || []).filter(id => id !== userId);
    
    // When demoting, remove from updateAuthors unless they were explicitly granted permission
    // (We keep them if they were manually added, but typically demoting removes update permission)
    const updateAuthors = circle.updateAuthors || [];
    const updatedUpdateAuthors = updateAuthors.filter(id => id !== userId);
    
    await firestoreUpdateDoc(circleDoc, {
      [`roles.${userId}`]: 'member',
      ownerIds: updatedOwnerIds,
      updateAuthors: updatedUpdateAuthors,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error demoting owner:', error);
    throw new Error('Failed to demote owner. Please try again.');
  }
};

/**
 * Leave circle (remove self)
 */
export const leaveCircle = async (
  circleId: string, 
  userId: string
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const circle = await getCircle(circleId);
    if (!circle) {
      throw new Error('Circle not found');
    }

    // Check if user is an owner (check both ownerId and ownerIds for backwards compatibility)
    const isOwner = circle.ownerId === userId || 
                    (circle.ownerIds && circle.ownerIds.includes(userId));
    
    if (isOwner) {
      throw new Error('Owners cannot leave their own circle. Transfer ownership first.');
    }

    // Check if user is actually a member
    if (!circle.members.includes(userId)) {
      throw new Error('You are not a member of this circle');
    }

    const updatedMembers = circle.members.filter(id => id !== userId);
    const updatedRoles = { ...circle.roles };
    delete updatedRoles[userId];
    
    // Also remove from ownerIds if present
    const updatedOwnerIds = circle.ownerIds 
      ? circle.ownerIds.filter(id => id !== userId)
      : undefined;

    const circleDoc = doc(circlesRef, circleId);
    const updateData: any = {
      members: updatedMembers,
      roles: updatedRoles,
      updatedAt: serverTimestamp(),
    };
    
    // Only update ownerIds if it exists
    if (updatedOwnerIds !== undefined) {
      updateData.ownerIds = updatedOwnerIds.length > 0 ? updatedOwnerIds : [];
    }
    
    await firestoreUpdateDoc(circleDoc, updateData);
  } catch (error) {
    console.error('Error leaving circle:', error);
    throw new Error('Failed to leave circle. Please try again.');
  }
};

/**
 * Toggle mute notifications for a circle
 */
export const toggleCircleMute = async (
  userId: string, 
  circleId: string, 
  isMuted: boolean
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const userDoc = doc(usersRef, userId);
    const userSnap = await getDoc(userDoc);
    
    if (!userSnap.exists()) {
      throw new Error('User not found');
    }

    const userData = userSnap.data();
    const circlesMuted = userData?.circlesMuted || [];
    
    let updatedMuted;
    if (isMuted) {
      // Add to muted list if not already there
      updatedMuted = circlesMuted.includes(circleId) ? circlesMuted : [...circlesMuted, circleId];
    } else {
      // Remove from muted list
      updatedMuted = circlesMuted.filter((id: string) => id !== circleId);
    }

    await retryOperation(
      async () => {
        await firestoreUpdateDoc(userDoc, {
          circlesMuted: updatedMuted,
        });
      },
      3, // maxRetries
      1000 // baseDelay
    );
  } catch (error: any) {
    // Log the actual error for debugging
    console.error('Error toggling circle mute:', {
      error,
      message: error?.message,
      code: error?.code,
      userId,
      circleId,
      isMuted,
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to update notification settings. Please try again.';
    if (error?.code === 'permission-denied') {
      errorMessage = "You don't have permission to update notification settings.";
    } else if (error?.code === 'unavailable' || error?.message?.includes('network')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    }
    
    handleError(error, 'toggleCircleMute');
    throw new Error(errorMessage);
  }
};

// Track last viewed timestamp per user per circle
export const setCircleLastViewed = async (
  userId: string,
  circleId: string
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  try {
    const userDocRef = doc(usersRef, userId);
    await firestoreUpdateDoc(userDocRef, {
      [`lastViewedCircles.${circleId}`]: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error setting last viewed:', error);
  }
};

// Update Management Functions

/**
 * Create a new update with offline support
 */
export const createUpdate = async (updateData: {
  circleId: string;
  authorId: string;
  text: string;
  photoURL?: string;
}): Promise<string> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    // Get encryption key for this circle
    let encryptedText = updateData.text;
    const encryptionKey = await getCircleEncryptionKey(updateData.circleId);
    
    if (encryptionKey) {
      try {
        encryptedText = await encryptText(updateData.text, encryptionKey);
      } catch (encryptionError) {
        console.error('Error encrypting update text:', encryptionError);
        // Fall back to unencrypted if encryption fails
      }
    }
    
    const updateDoc: any = {
      circleId: updateData.circleId,
      authorId: updateData.authorId,
      text: encryptedText,
      encrypted: encryptionKey !== null, // Flag to indicate if data is encrypted
      createdAt: serverTimestamp(),
      reactions: {},
    };
    
    // Only include photoURL if it exists
    if (updateData.photoURL) {
      updateDoc.photoURL = updateData.photoURL;
    }
    
    const docRef = await retryOperation(async () => {
      return await addDoc(updatesRef, updateDoc);
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating update:', error);
    
    // If it's a network error, queue for offline
    if (error?.code === 'unavailable' || error?.message?.includes('network')) {
      try {
        await addOfflineUpdate(updateData);
        throw new Error('Update queued for when you\'re back online');
      } catch (queueError) {
        console.error('Error queuing offline update:', queueError);
      }
    }
    
    handleError(error, 'Create Update');
    throw new Error('Failed to create update. Please try again.');
  }
};

/**
 * Get updates for a circle
 */
export const getCircleUpdates = async (circleId: string): Promise<Update[]> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const q = query(
      updatesRef,
      where('circleId', '==', circleId)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Get encryption key for this circle
    const encryptionKey = await getCircleEncryptionKey(circleId);
    
    // Process all documents (decrypt if needed)
    const updatePromises = querySnapshot.docs.map(async (doc) => {
      const data = doc.data();
      let text = data.text;
      
      // Decrypt if encrypted
      if (data.encrypted && encryptionKey) {
        try {
          text = await decryptText(data.text, encryptionKey);
        } catch (decryptionError) {
          console.error('Error decrypting update text:', decryptionError);
          text = '[Encrypted content - decryption failed]';
        }
      }
      
      return {
        id: doc.id,
        circleId: data.circleId,
        authorId: data.authorId,
        text: text,
        photoURL: data.photoURL,
        createdAt: data.createdAt?.toDate() || new Date(),
        reactions: data.reactions || {},
      };
    });
    
    const updates = await Promise.all(updatePromises);

    // Sort by creation date (newest first)
    updates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return updates;
  } catch (error) {
    console.error('Error getting circle updates:', error);
    throw new Error('Failed to fetch updates. Please try again.');
  }
};

/**
 * Get paginated updates for a circle
 * @param circleId - The circle ID
 * @param pageSize - Number of updates to fetch per page (default: 15)
 * @param lastUpdate - The last update document snapshot for pagination (optional)
 * @returns Object with updates array and lastDoc for next page
 */
export const getCircleUpdatesPaginated = async (
  circleId: string,
  pageSize: number = 15,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ updates: Update[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null; hasMore: boolean }> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    // Build query with pagination
    let q = query(
      updatesRef,
      where('circleId', '==', circleId),
      orderBy('createdAt', 'desc'),
      limit(pageSize + 1) // Fetch one extra to check if there are more
    );

    // Add startAfter if we have a last document
    if (lastDoc) {
      q = query(
        updatesRef,
        where('circleId', '==', circleId),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(pageSize + 1)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs;
    
    // Check if there are more pages
    const hasMore = docs.length > pageSize;
    const updatesToProcess = hasMore ? docs.slice(0, pageSize) : docs;
    const lastUpdateDoc = updatesToProcess.length > 0 ? updatesToProcess[updatesToProcess.length - 1] : null;
    
    // Get encryption key for this circle
    const encryptionKey = await getCircleEncryptionKey(circleId);
    
    // Process documents (decrypt if needed)
    const updatePromises = updatesToProcess.map(async (doc) => {
      const data = doc.data();
      let text = data.text;
      
      // Decrypt if encrypted
      if (data.encrypted && encryptionKey) {
        try {
          text = await decryptText(data.text, encryptionKey);
        } catch (decryptionError) {
          console.error('Error decrypting update text:', decryptionError);
          text = '[Encrypted content - decryption failed]';
        }
      }
      
      return {
        id: doc.id,
        circleId: data.circleId,
        authorId: data.authorId,
        text: text,
        photoURL: data.photoURL,
        createdAt: data.createdAt?.toDate() || new Date(),
        reactions: data.reactions || {},
      };
    });
    
    const updates = await Promise.all(updatePromises);

    return {
      updates,
      lastDoc: lastUpdateDoc,
      hasMore,
    };
  } catch (error: any) {
    console.error('Error getting paginated circle updates:', error);
    
    // Check if it's a missing index error
    if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
      console.error('Firestore index missing. Please create a composite index for updates collection:');
      console.error('Collection: updates');
      console.error('Fields: circleId (Ascending), createdAt (Descending)');
      throw new Error('Database index is being created. Please try again in a few moments.');
    }
    
    // Check for permission errors
    if (error?.code === 'permission-denied') {
      throw new Error('You do not have permission to view updates in this circle.');
    }
    
    throw new Error('Failed to fetch updates. Please try again.');
  }
};

// Real-time listeners

/**
 * Subscribe to user's circles with real-time updates
 */
export const subscribeToUserCircles = (
  userId: string,
  callback: (circles: Circle[]) => void
): (() => void) => {
  if (!db) {
    console.warn('Firestore not initialized');
    return () => {};
  }

  // Use a simpler query that doesn't require a composite index
  const q = query(
    circlesRef,
    where('members', 'array-contains', userId)
  );

  return onSnapshot(q, (querySnapshot) => {
    const circles: Circle[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      circles.push({
        id: doc.id,
        title: data.title,
        ownerId: data.ownerId,
        members: data.members || [],
        ownerIds: data.ownerIds || [data.ownerId],
        updateAuthors: data.updateAuthors || [data.ownerId],
        roles: data.roles || {},
        createdAt: data.createdAt?.toDate() || new Date(),
        lastUpdateAt: data.lastUpdateAt?.toDate ? data.lastUpdateAt.toDate() : undefined,
      });
    });

    // Sort by creation date on the client side to avoid index requirement
    circles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    callback(circles);
  }, (error) => {
    console.error('Error in circles subscription:', error);
  });
};

/**
 * Subscribe to circle updates with real-time updates
 */
export const subscribeToCircleUpdates = (
  circleId: string,
  callback: (updates: Update[]) => void
): (() => void) => {
  if (!db) {
    console.warn('Firestore not initialized');
    return () => {};
  }

  const q = query(
    updatesRef,
    where('circleId', '==', circleId)
  );

  return onSnapshot(q, async (querySnapshot) => {
    // Get encryption key for this circle
    const encryptionKey = await getCircleEncryptionKey(circleId);
    
    // Process all documents (decrypt if needed)
    const updatePromises = querySnapshot.docs.map(async (doc) => {
      const data = doc.data();
      let text = data.text;
      
      // Decrypt if encrypted
      if (data.encrypted && encryptionKey) {
        try {
          text = await decryptText(data.text, encryptionKey);
        } catch (decryptionError) {
          console.error('Error decrypting update text:', decryptionError);
          text = '[Encrypted content - decryption failed]';
        }
      }
      
      return {
        id: doc.id,
        circleId: data.circleId,
        authorId: data.authorId,
        text: text,
        photoURL: data.photoURL,
        createdAt: data.createdAt?.toDate() || new Date(),
        reactions: data.reactions || {},
      };
    });
    
    const updates = await Promise.all(updatePromises);

    // Sort by creation date on the client side
    updates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    callback(updates);
  }, (error) => {
    console.error('Error in updates subscription:', error);
    // Return empty array on permission error to prevent UI crashes
    if (error.code === 'permission-denied') {
      console.warn('Permission denied for updates. User may not be a member of this circle.');
      callback([]);
    }
  });
};

// Reaction Management Functions

/**
 * Toggle a reaction on an update with offline support
 */
export const toggleReaction = async (
  updateId: string,
  userId: string,
  emoji: string
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const updateRef = doc(updatesRef, updateId);
    const updateDoc = await getDoc(updateRef);
    
    if (!updateDoc.exists()) {
      throw new Error('Update not found');
    }
    
    const currentData = updateDoc.data();
    const currentReactions = currentData.reactions || {};
    
    // Check if user already reacted with this emoji
    if (currentReactions[userId] === emoji) {
      // Remove the reaction
      delete currentReactions[userId];
    } else {
      // Add or change the reaction
      currentReactions[userId] = emoji;
    }
    
    // Update the document
    await retryOperation(async () => {
      await firestoreUpdateDoc(updateRef, {
        reactions: currentReactions,
      });
    });
    
  } catch (error) {
    console.error('Error toggling reaction:', error);
    
    // If it's a network error, queue for offline
    if (error?.code === 'unavailable' || error?.message?.includes('network')) {
      try {
        await addOfflineReaction({ updateId, userId, emoji });
        throw new Error('Reaction queued for when you\'re back online');
      } catch (queueError) {
        console.error('Error queuing offline reaction:', queueError);
      }
    }
    
    handleError(error, 'Toggle Reaction');
    throw new Error('Failed to update reaction. Please try again.');
  }
};

// Comment Management Functions

/**
 * Create a new comment with offline support
 */
export const createComment = async (commentData: {
  updateId: string;
  authorId: string;
  text: string;
  circleId?: string; // Add circleId to get encryption key
}): Promise<string> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    // Get encryption key if circleId is provided
    let encryptedText = commentData.text;
    let isEncrypted = false;
    
    if (commentData.circleId) {
      const encryptionKey = await getCircleEncryptionKey(commentData.circleId);
      if (encryptionKey) {
        try {
          encryptedText = await encryptText(commentData.text, encryptionKey);
          isEncrypted = true;
        } catch (encryptionError) {
          console.error('Error encrypting comment text:', encryptionError);
          // Fall back to unencrypted
        }
      }
    }
    
    const docRef = await retryOperation(async () => {
      return await addDoc(commentsRef, {
        updateId: commentData.updateId,
        authorId: commentData.authorId,
        text: encryptedText,
        encrypted: isEncrypted,
        createdAt: serverTimestamp(),
      });
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating comment:', error);
    
    // If it's a network error, queue for offline
    if (error?.code === 'unavailable' || error?.message?.includes('network')) {
      try {
        await addOfflineComment(commentData);
        throw new Error('Comment queued for when you\'re back online');
      } catch (queueError) {
        console.error('Error queuing offline comment:', queueError);
      }
    }
    
    handleError(error, 'Create Comment');
    throw new Error('Failed to create comment. Please try again.');
  }
};

/**
 * Get comments for an update
 */
export const getComments = async (updateId: string, circleId?: string): Promise<Comment[]> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const q = query(
      commentsRef,
      where('updateId', '==', updateId),
      orderBy('createdAt', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    
    // Get encryption key if circleId is provided
    const encryptionKey = circleId ? await getCircleEncryptionKey(circleId) : null;
    
    // Process all comments (decrypt if needed)
    const commentPromises = querySnapshot.docs.map(async (doc) => {
      const data = doc.data();
      let text = data.text;
      
      // Decrypt if encrypted
      if (data.encrypted && encryptionKey) {
        try {
          text = await decryptText(data.text, encryptionKey);
        } catch (decryptionError) {
          console.error('Error decrypting comment text:', decryptionError);
          text = '[Encrypted content - decryption failed]';
        }
      }
      
      return {
        id: doc.id,
        updateId: data.updateId,
        authorId: data.authorId,
        text: text,
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    });
    
    const comments = await Promise.all(commentPromises);

    return comments;
  } catch (error) {
    console.error('Error getting comments:', error);
    throw new Error('Failed to fetch comments. Please try again.');
  }
};

/**
 * Subscribe to comments for an update
 */
export const subscribeToComments = (
  updateId: string,
  callback: (comments: Comment[]) => void,
  circleId?: string
): (() => void) => {
  if (!db) {
    console.error('Firestore not initialized');
    return () => {};
  }

  const q = query(
    commentsRef,
    where('updateId', '==', updateId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, async (querySnapshot) => {
    // Get encryption key if circleId is provided
    const encryptionKey = circleId ? await getCircleEncryptionKey(circleId) : null;
    
    // Process all comments (decrypt if needed)
    const commentPromises = querySnapshot.docs.map(async (doc) => {
      const data = doc.data();
      let text = data.text;
      
      // Decrypt if encrypted
      if (data.encrypted && encryptionKey) {
        try {
          text = await decryptText(data.text, encryptionKey);
        } catch (decryptionError) {
          console.error('Error decrypting comment text:', decryptionError);
          text = '[Encrypted content - decryption failed]';
        }
      }
      
      return {
        id: doc.id,
        updateId: data.updateId,
        authorId: data.authorId,
        text: text,
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    });
    
    const comments = await Promise.all(commentPromises);
    callback(comments);
  }, (error) => {
    console.error('Error in comments subscription:', error);
  });
};

/**
 * Get paginated comments for an update
 * @param updateId - The update ID
 * @param pageSize - Number of comments to fetch per page (default: 20)
 * @param lastComment - The last comment document snapshot for pagination (optional)
 * @param circleId - Optional circle ID for encryption
 * @returns Object with comments array and lastDoc for next page
 */
export const getCommentsPaginated = async (
  updateId: string,
  pageSize: number = 20,
  lastComment?: QueryDocumentSnapshot<DocumentData>,
  circleId?: string
): Promise<{ comments: Comment[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null; hasMore: boolean }> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    // Build query with pagination
    let q = query(
      commentsRef,
      where('updateId', '==', updateId),
      orderBy('createdAt', 'asc'),
      limit(pageSize + 1) // Fetch one extra to check if there are more
    );

    // Add startAfter if we have a last document
    if (lastComment) {
      q = query(
        commentsRef,
        where('updateId', '==', updateId),
        orderBy('createdAt', 'asc'),
        startAfter(lastComment),
        limit(pageSize + 1)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs;
    
    // Check if there are more pages
    const hasMore = docs.length > pageSize;
    const commentsToProcess = hasMore ? docs.slice(0, pageSize) : docs;
    const lastCommentDoc = commentsToProcess.length > 0 ? commentsToProcess[commentsToProcess.length - 1] : null;
    
    // Get encryption key if circleId is provided
    const encryptionKey = circleId ? await getCircleEncryptionKey(circleId) : null;
    
    // Process comments (decrypt if needed)
    const commentPromises = commentsToProcess.map(async (doc) => {
      const data = doc.data();
      let text = data.text;
      
      // Decrypt if encrypted
      if (data.encrypted && encryptionKey) {
        try {
          text = await decryptText(data.text, encryptionKey);
        } catch (decryptionError) {
          console.error('Error decrypting comment text:', decryptionError);
          text = '[Encrypted content - decryption failed]';
        }
      }
      
      return {
        id: doc.id,
        updateId: data.updateId,
        authorId: data.authorId,
        text: text,
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    });
    
    const comments = await Promise.all(commentPromises);

    return {
      comments,
      lastDoc: lastCommentDoc,
      hasMore,
    };
  } catch (error) {
    console.error('Error getting paginated comments:', error);
    throw new Error('Failed to fetch comments. Please try again.');
  }
};

// Update Author Management Functions

/**
 * Migrate existing circle to include current user in members array
 * This fixes permission issues for existing circles
 */
export const migrateCircleMembership = async (circleId: string, userId: string): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    // First, try to read the circle document
    const circleDoc = await getDoc(doc(circlesRef, circleId));
    
    if (!circleDoc.exists()) {
      throw new Error('Circle not found');
    }
    
    const data = circleDoc.data();
    
    // Check if user is already in members array
    if (data.members && data.members.includes(userId)) {
      return; // Already migrated
    }
    
    // Check if user is the owner
    const isOwner = data.ownerId === userId || (data.ownerIds && data.ownerIds.includes(userId));
    
    if (isOwner) {
      // Add user to members array and initialize updateAuthors if missing
      const updates: any = {
        members: [...(data.members || []), userId],
      };
      
      if (!data.updateAuthors) {
        updates.updateAuthors = userId === data.ownerId ? [userId] : (data.ownerIds || [userId]);
      }
      
      await firestoreUpdateDoc(doc(circlesRef, circleId), updates);
      console.log('Circle membership migrated successfully');
    }
  } catch (error) {
    console.error('Error migrating circle membership:', error);
    throw error;
  }
};

/**
 * Check if a user can post updates in a circle
 */
export const canUserPostUpdates = async (circleId: string, userId: string): Promise<boolean> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const circleDoc = await getDoc(doc(circlesRef, circleId));
    
    if (!circleDoc.exists()) {
      return false;
    }
    
    const data = circleDoc.data();
    
    // Check if user is an owner (owners always have permission to post)
    const isOwner = data.ownerId === userId || (data.ownerIds && data.ownerIds.includes(userId));
    
    // If owner, ensure they're in updateAuthors and return true
    if (isOwner) {
      const updateAuthors = data.updateAuthors || [];
      if (!updateAuthors.includes(userId)) {
        // Add owner to updateAuthors if not already there
        await firestoreUpdateDoc(doc(circlesRef, circleId), {
          updateAuthors: [...updateAuthors, userId],
        });
      }
      return true;
    }
    
    // For non-owners, check updateAuthors array
    if (data.updateAuthors) {
      return data.updateAuthors.includes(userId);
    }
    
    // Fallback for old circles without updateAuthors
    return false;
  } catch (error) {
    console.error('Error checking update permissions:', error);
    
    // If we can't read the circle document due to permissions,
    // try to migrate the circle membership first
    try {
      console.log('Attempting to migrate circle membership...');
      await migrateCircleMembership(circleId, userId);
      
      // Try again after migration
      const circleDoc = await getDoc(doc(circlesRef, circleId));
      if (circleDoc.exists()) {
        const data = circleDoc.data();
        return data.updateAuthors ? data.updateAuthors.includes(userId) : 
               (data.ownerId === userId || (data.ownerIds && data.ownerIds.includes(userId)));
      }
    } catch (migrationError) {
      console.error('Migration failed:', migrationError);
    }
    
    return false;
  }
};

/**
 * Add a user to the updateAuthors array for a circle
 */
export const addUpdateAuthor = async (circleId: string, userId: string): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const circleDoc = await getDoc(doc(circlesRef, circleId));
    
    if (!circleDoc.exists()) {
      throw new Error('Circle not found');
    }
    
    const data = circleDoc.data();
    const updateAuthors = data.updateAuthors || [data.ownerId];
    
    if (updateAuthors.includes(userId)) {
      throw new Error('User is already an update author');
    }
    
    await firestoreUpdateDoc(doc(circlesRef, circleId), {
      updateAuthors: [...updateAuthors, userId],
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error adding update author:', error);
    throw error;
  }
};

/**
 * Remove a user from the updateAuthors array for a circle
 */
export const removeUpdateAuthor = async (circleId: string, userId: string): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const circleDoc = await getDoc(doc(circlesRef, circleId));
    
    if (!circleDoc.exists()) {
      throw new Error('Circle not found');
    }
    
    const data = circleDoc.data();
    const updateAuthors = data.updateAuthors || [data.ownerId];
    
    if (!updateAuthors.includes(userId)) {
      throw new Error('User is not an update author');
    }
    
    // Don't allow removing the circle owner
    if (data.ownerId === userId) {
      throw new Error('Cannot remove circle owner from update authors');
    }
    
    await firestoreUpdateDoc(doc(circlesRef, circleId), {
      updateAuthors: updateAuthors.filter(id => id !== userId),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error removing update author:', error);
    throw error;
  }
};

// Join Request Management

export interface JoinRequest {
  id: string;
  userId: string;
  displayName: string;
  relation: string;
  status: 'pending' | 'approved' | 'declined';
  inviteId?: string;
  createdAt: Date;
}

export const createJoinRequest = async (
  circleId: string,
  request: { userId: string; displayName: string; relation: string; inviteId?: string }
): Promise<string> => {
  if (!functions) {
    throw new Error('Firebase functions not initialized');
  }

  try {
    const callable = httpsCallable(functions, 'submitJoinRequest');
    const result = await callable({
      circleId,
      displayName: request.displayName,
      relation: request.relation,
      inviteId: request.inviteId,
    });
    const data = result.data as any;
    return data?.requestId || '';
  } catch (error) {
    console.error('Error creating join request:', error);
    throw new Error('Failed to submit join request. Please try again.');
  }
};

export const getPendingJoinRequests = async (circleId: string): Promise<JoinRequest[]> => {
  if (!functions) {
    throw new Error('Firebase functions not initialized');
  }
  try {
    const callable = httpsCallable(functions, 'listJoinRequests');
    const result = await callable({ circleId });
    const data = (result.data as any)?.requests || [];
    return data.map((d: any) => ({
      id: d.id,
      userId: d.userId,
      displayName: d.displayName,
      relation: d.relation,
      status: d.status,
      inviteId: d.inviteId || undefined,
      createdAt: d.createdAt ? new Date(d.createdAt._seconds ? d.createdAt._seconds * 1000 : d.createdAt) : new Date(),
    }));
  } catch (error) {
    // Silently fall back to no pending requests (e.g., non-owner or transient errors)
    return [];
  }
};

export const approveJoinRequest = async (
  circleId: string,
  requestId: string,
  requesterUserId: string
): Promise<void> => {
  if (!functions) {
    throw new Error('Firebase functions not initialized');
  }
  try {
    const callable = httpsCallable(functions, 'ownerApproveJoinRequest');
    await callable({ circleId, requestId });
    
    // After member is added, ensure they can access the encryption key
    // The key should already be in Firestore, but trigger a fetch to ensure it's stored locally
    try {
      const { getCircleEncryptionKey } = await import('./encryption');
      // This will fetch from Firestore if not already stored locally
      await getCircleEncryptionKey(circleId);
    } catch (keyError) {
      console.error('Error ensuring encryption key access:', keyError);
      // Don't fail the approval if key fetch fails
    }
  } catch (error) {
    console.error('Error approving join request:', error);
    throw new Error('Failed to approve request.');
  }
};

export const declineJoinRequest = async (
  circleId: string,
  requestId: string
): Promise<void> => {
  if (!functions) {
    throw new Error('Firebase functions not initialized');
  }
  try {
    const callable = httpsCallable(functions, 'ownerDeclineJoinRequest');
    await callable({ circleId, requestId });
  } catch (error) {
    console.error('Error declining join request:', error);
    throw new Error('Failed to decline request.');
  }
};

// Invite helpers

export const getInviteInfo = async (
  inviteId: string
): Promise<{ circleId: string; expiresAt?: Date } | null> => {
  if (!functions) {
    throw new Error('Firebase functions not initialized');
  }
  try {
    const callable = httpsCallable(functions, 'getInviteInfo');
    const result = await callable({ inviteId });
    const data = result.data as any;
    if (!data?.circleId) return null;
    return {
      circleId: data.circleId,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    };
  } catch (error: any) {
    // Fallback: treat code as a potential circleId for owner-shared codes
    try {
      const circleSnap = await getDoc(doc(circlesRef, inviteId));
      if (circleSnap.exists()) {
        return { circleId: circleSnap.id };
      }
    } catch {}
    console.error('Error reading invite:', error);
    throw new Error('Failed to read invite.');
  }
};

/**
 * Update user document
 */
export const updateUser = async (
  userId: string,
  updates: Partial<{
    displayName: string;
    photoURL: string;
    expoPushToken: string;
    circlesMuted: string[];
    lastViewedCircles: Record<string, Date>;
  }>
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const userDoc = doc(usersRef, userId);
    const updateData: any = { ...updates };
    
    // Convert Date objects to Firestore Timestamps
    if (updates.lastViewedCircles) {
      const timestampMap: Record<string, any> = {};
      Object.entries(updates.lastViewedCircles).forEach(([key, value]) => {
        timestampMap[key] = Timestamp.fromDate(value);
      });
      updateData.lastViewedCircles = timestampMap;
    }

    await firestoreUpdateDoc(userDoc, updateData);
  } catch (error) {
    console.error('Error updating user:', error);
    throw new Error('Failed to update user. Please try again.');
  }
};

/**
 * Delete user account and all associated data
 * This function handles:
 * - Removing user from all circles
 * - Anonymizing updates and comments
 * - Deleting user's photos from Storage
 * - Deleting user document from Firestore
 * Note: Firebase Auth account deletion must be done separately
 */
export const deleteAccount = async (userId: string): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  // Note: Authentication is verified in handleDeleteAccount before calling this
  // Firestore security rules will enforce permissions
  // We don't check auth.currentUser here because it's called while user is authenticated

  try {
    // Step 1: Get all circles where user is a member
    const circlesQuery = query(
      circlesRef,
      where('members', 'array-contains', userId)
    );
    const circlesSnapshot = await getDocs(circlesQuery);
    const userCircles: Circle[] = [];
    
    circlesSnapshot.forEach((doc) => {
      const data = doc.data();
      userCircles.push({
        id: doc.id,
        title: data.title,
        ownerId: data.ownerId,
        ownerIds: data.ownerIds || [data.ownerId],
        members: data.members || [],
        updateAuthors: data.updateAuthors || [],
        roles: data.roles || {},
        createdAt: data.createdAt?.toDate() || new Date(),
      });
    });

    // Step 2: Prepare batch operations
    // Firestore batches have a limit of 500 operations, so we need to split into multiple batches if needed
    // CRITICAL: We must commit updates/comments/reactions batches BEFORE circle removal batches
    // because security rules check current document state, not proposed state
    const MAX_BATCH_SIZE = 500;
    
    // Step 2a: Anonymize updates/comments/reactions FIRST (while user is still a member)
    let currentBatch = writeBatch(db);
    let batchSize = 0;
    const updateBatchesToCommit: Array<ReturnType<typeof writeBatch>> = [];

    const saveBatchIfNeeded = (batchList: Array<ReturnType<typeof writeBatch>>) => {
      if (batchSize >= MAX_BATCH_SIZE) {
        batchList.push(currentBatch);
        currentBatch = writeBatch(db);
        batchSize = 0;
      }
    };

    // Anonymize updates by this user
    // Query through circles the user is a member of (to avoid security rule issues)
    const updatesToAnonymize: Array<{ id: string; circleId: string }> = [];
    for (const circle of userCircles) {
      const circleUpdatesQuery = query(
        updatesRef,
        where('circleId', '==', circle.id),
        where('authorId', '==', userId)
      );
      const circleUpdatesSnapshot = await getDocs(circleUpdatesQuery);
      circleUpdatesSnapshot.docs.forEach(updateDoc => {
        updatesToAnonymize.push({ id: updateDoc.id, circleId: circle.id });
      });
    }
    for (const updateInfo of updatesToAnonymize) {
      saveBatchIfNeeded(updateBatchesToCommit);
      currentBatch.update(doc(updatesRef, updateInfo.id), {
        authorId: '[deleted]',
        text: '[This update was deleted]',
        photoURL: null,
      });
      batchSize++;
    }

    // Anonymize comments by this user
    // Query through updates in circles the user is a member of
    const commentsToAnonymize: Array<{ id: string }> = [];
    for (const updateInfo of updatesToAnonymize) {
      const updateCommentsQuery = query(
        commentsRef,
        where('updateId', '==', updateInfo.id),
        where('authorId', '==', userId)
      );
      const updateCommentsSnapshot = await getDocs(updateCommentsQuery);
      updateCommentsSnapshot.docs.forEach(commentDoc => {
        commentsToAnonymize.push({ id: commentDoc.id });
      });
    }
    for (const commentInfo of commentsToAnonymize) {
      saveBatchIfNeeded(updateBatchesToCommit);
      currentBatch.update(doc(commentsRef, commentInfo.id), {
        authorId: '[deleted]',
        text: '[This comment was deleted]',
      });
      batchSize++;
    }

    // Remove user's reactions from updates in circles they were a member of
    for (const circle of userCircles) {
      const circleUpdatesQuery = query(
        updatesRef,
        where('circleId', '==', circle.id)
      );
      const circleUpdatesSnapshot = await getDocs(circleUpdatesQuery);
      for (const updateDoc of circleUpdatesSnapshot.docs) {
        const data = updateDoc.data();
        const reactions = data.reactions || {};
        if (reactions[userId]) {
          saveBatchIfNeeded(updateBatchesToCommit);
          const updatedReactions = { ...reactions };
          delete updatedReactions[userId];
          currentBatch.update(doc(updatesRef, updateDoc.id), {
            reactions: updatedReactions,
          });
          batchSize++;
        }
      }
    }

    // Add the last update batch if it has operations
    if (batchSize > 0) {
      updateBatchesToCommit.push(currentBatch);
    }

    // Commit all update/comment/reaction batches FIRST
    for (let i = 0; i < updateBatchesToCommit.length; i++) {
      const batchToCommit = updateBatchesToCommit[i];
      try {
        await batchToCommit.commit();
      } catch (batchError: any) {
        // Log which operation failed for debugging
        if (batchError.code === 'permission-denied' || batchError.code === 'PERMISSION_DENIED') {
          throw new Error(`Permission denied while updating user content (batch ${i + 1}). Please ensure you are signed in. Error: ${batchError.message}`);
        }
        throw batchError;
      }
    }

    // Step 2b: Remove user from circles AFTER all updates/comments/reactions are done
    currentBatch = writeBatch(db);
    batchSize = 0;
    const circleBatchesToCommit: Array<ReturnType<typeof writeBatch>> = [];

    for (const circle of userCircles) {
      // Determine ownership status - check both ownerId and ownerIds for backwards compatibility
      const ownerIdsList = circle.ownerIds || (circle.ownerId ? [circle.ownerId] : []);
      const isOwner = ownerIdsList.includes(userId) || circle.ownerId === userId;
      const ownerCount = ownerIdsList.length;
      const isOnlyOwner = isOwner && ownerCount === 1;
      
      saveBatchIfNeeded(circleBatchesToCommit);
      
      if (isOnlyOwner) {
        // If user is the only owner, we need to either:
        // 1. Delete the circle (if no other members)
        // 2. Transfer ownership to another member (if other members exist)
        if (circle.members.length === 1) {
          // Only owner and only member, delete the circle
          // Security rule: allow delete if request.auth.uid in resource.data.ownerIds
          currentBatch.delete(doc(circlesRef, circle.id));
          batchSize++;
        } else {
          // Transfer ownership to first other member
          // Security rule: owners can update metadata (including ownerId)
          const otherMembers = circle.members.filter(id => id !== userId);
          if (otherMembers.length > 0) {
            const newOwnerId = otherMembers[0];
            currentBatch.update(doc(circlesRef, circle.id), {
              ownerId: newOwnerId,
              ownerIds: [newOwnerId],
              members: circle.members.filter(id => id !== userId),
              [`roles.${newOwnerId}`]: 'owner',
              [`roles.${userId}`]: FieldValue.delete(),
              updateAuthors: circle.updateAuthors.filter(id => id !== userId).concat([newOwnerId]),
              updatedAt: serverTimestamp(),
            });
            batchSize++;
          }
        }
      } else if (isOwner) {
        // Co-owner (not the only owner) - remove from ownerIds and members
        // Security rule: owners can update metadata (including ownerId)
        const updatedMembers = circle.members.filter(id => id !== userId);
        const updatedOwnerIds = ownerIdsList.filter(id => id !== userId);
        const updatedUpdateAuthors = circle.updateAuthors.filter(id => id !== userId);
        const updatedRoles = { ...circle.roles };
        delete updatedRoles[userId];
        
        // Ensure we maintain at least one owner
        const finalOwnerIds = updatedOwnerIds.length > 0 ? updatedOwnerIds : ownerIdsList.filter(id => id !== userId);
        const finalOwnerId = finalOwnerIds.length > 0 ? finalOwnerIds[0] : circle.ownerId;
        
        currentBatch.update(doc(circlesRef, circle.id), {
          ownerId: finalOwnerId,
          ownerIds: finalOwnerIds,
          members: updatedMembers,
          updateAuthors: updatedUpdateAuthors,
          roles: updatedRoles,
          updatedAt: serverTimestamp(),
        });
        batchSize++;
      } else {
        // Regular member (not an owner), just remove from circle
        // Security rule: members can update: members, roles, ownerIds, updateAuthors, updatedAt
        // NOTE: Cannot update ownerId - only owners can do that
        const updatedMembers = circle.members.filter(id => id !== userId);
        const updatedOwnerIds = ownerIdsList.filter(id => id !== userId);
        const updatedUpdateAuthors = circle.updateAuthors.filter(id => id !== userId);
        const updatedRoles = { ...circle.roles };
        delete updatedRoles[userId];
        
        // For members, we can only update the allowed fields (not ownerId)
        const updateData: any = {
          members: updatedMembers,
          updateAuthors: updatedUpdateAuthors,
          roles: updatedRoles,
          updatedAt: serverTimestamp(),
        };
        
        // Only update ownerIds if it exists (members can update this field)
        if (circle.ownerIds) {
          updateData.ownerIds = updatedOwnerIds.length > 0 ? updatedOwnerIds : ownerIdsList;
        }
        
        currentBatch.update(doc(circlesRef, circle.id), updateData);
        batchSize++;
      }
    }

    // Add the last circle batch if it has operations
    if (batchSize > 0) {
      circleBatchesToCommit.push(currentBatch);
    }
    
    // Commit all circle removal batches AFTER update batches
    for (let i = 0; i < circleBatchesToCommit.length; i++) {
      const batchToCommit = circleBatchesToCommit[i];
      try {
        await batchToCommit.commit();
      } catch (batchError: any) {
        // Log which operation failed for debugging
        if (batchError.code === 'permission-denied' || batchError.code === 'PERMISSION_DENIED') {
          throw new Error(`Permission denied while removing user from circles (batch ${i + 1}). Please ensure you are signed in. Error: ${batchError.message}`);
        }
        throw batchError;
      }
    }

    // Step 6: Delete user's photos from Storage
    if (storage) {
      try {
        // Delete profile photos
        const profileRef = ref(storage, `profiles/${userId}`);
        try {
          const profileList = await listAll(profileRef);
          await Promise.all(profileList.items.map(item => deleteObject(item)));
        } catch (profileError) {
          // Profile folder might not exist, that's okay
          console.warn('Error deleting profile photos:', profileError);
        }

        // Delete update photos
        const updatesStorageRef = ref(storage, `updates/${userId}`);
        try {
          const updatesList = await listAll(updatesStorageRef);
          await Promise.all(updatesList.items.map(item => deleteObject(item)));
        } catch (updatesError) {
          // Updates folder might not exist, that's okay
          console.warn('Error deleting update photos:', updatesError);
        }
      } catch (storageError) {
        console.error('Error deleting user photos from Storage:', storageError);
        // Don't fail account deletion if storage deletion fails
      }
    }

    // Step 7: Delete user document from Firestore
    try {
      await deleteDoc(doc(usersRef, userId));
    } catch (userDocError: any) {
      console.error('Error deleting user document:', userDocError);
      // If user document deletion fails, it might already be deleted or have permission issues
      // Continue with account deletion process
      if (userDocError.code !== 'permission-denied') {
        throw userDocError;
      }
    }

    console.log('Account deletion completed successfully');
  } catch (error: any) {
    console.error('Error deleting account:', error);
    
    // Provide more specific error messages
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please make sure you are signed in and try again.');
    } else if (error.code === 'unavailable') {
      throw new Error('Network error. Please check your connection and try again.');
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Failed to delete account. Please try again.');
    }
  }
};
