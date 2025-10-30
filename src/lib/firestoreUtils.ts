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
  onSnapshot, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db, functions } from './firebase';
import { httpsCallable } from 'firebase/functions';
import { Circle, Update, User, Comment } from '../types';
import { handleError, retryOperation } from './errorHandler';
import { addOfflineUpdate, addOfflineComment, addOfflineReaction } from './offlineQueue';

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

    // Check if user is the owner
    if (circle.ownerId === userId) {
      throw new Error('Owners cannot leave their own circle. Transfer ownership first.');
    }

    const updatedMembers = circle.members.filter(id => id !== userId);
    const updatedRoles = { ...circle.roles };
    delete updatedRoles[userId];

    const circleDoc = doc(circlesRef, circleId);
    await firestoreUpdateDoc(circleDoc, {
      members: updatedMembers,
      roles: updatedRoles,
      updatedAt: serverTimestamp(),
    });
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
    const updateDoc: any = {
      circleId: updateData.circleId,
      authorId: updateData.authorId,
      text: updateData.text,
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
    const updates: Update[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      updates.push({
        id: doc.id,
        circleId: data.circleId,
        authorId: data.authorId,
        text: data.text,
        photoURL: data.photoURL,
        createdAt: data.createdAt?.toDate() || new Date(),
        reactions: data.reactions || {},
      });
    });

    // Sort by creation date (newest first)
    updates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return updates;
  } catch (error) {
    console.error('Error getting circle updates:', error);
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

  return onSnapshot(q, (querySnapshot) => {
    const updates: Update[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      updates.push({
        id: doc.id,
        circleId: data.circleId,
        authorId: data.authorId,
        text: data.text,
        photoURL: data.photoURL,
        createdAt: data.createdAt?.toDate() || new Date(),
        reactions: data.reactions || {},
      });
    });

    // Sort by creation date on the client side
    updates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    callback(updates);
  }, (error) => {
    console.error('Error in updates subscription:', error);
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
}): Promise<string> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const docRef = await retryOperation(async () => {
      return await addDoc(commentsRef, {
        ...commentData,
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
export const getComments = async (updateId: string): Promise<Comment[]> => {
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
    const comments: Comment[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      comments.push({
        id: doc.id,
        updateId: data.updateId,
        authorId: data.authorId,
        text: data.text,
        createdAt: data.createdAt?.toDate() || new Date(),
      });
    });

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
  callback: (comments: Comment[]) => void
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

  return onSnapshot(q, (querySnapshot) => {
    const comments: Comment[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      comments.push({
        id: doc.id,
        updateId: data.updateId,
        authorId: data.authorId,
        text: data.text,
        createdAt: data.createdAt?.toDate() || new Date(),
      });
    });

    callback(comments);
  }, (error) => {
    console.error('Error in comments subscription:', error);
  });
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
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const docRef = await addDoc(joinRequestsSubcollection(circleId), {
      userId: request.userId,
      displayName: request.displayName,
      relation: request.relation,
      status: 'pending',
      inviteId: request.inviteId || null,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating join request:', error);
    throw new Error('Failed to submit join request. Please try again.');
  }
};

export const getPendingJoinRequests = async (circleId: string): Promise<JoinRequest[]> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const q = query(joinRequestsSubcollection(circleId), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    const requests: JoinRequest[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as any;
      requests.push({
        id: d.id,
        userId: data.userId,
        displayName: data.displayName,
        relation: data.relation,
        status: data.status,
        inviteId: data.inviteId || undefined,
        createdAt: data.createdAt?.toDate() || new Date(),
      });
    });
    return requests;
  } catch (error) {
    console.error('Error fetching join requests:', error);
    throw new Error('Failed to load join requests.');
  }
};

export const approveJoinRequest = async (
  circleId: string,
  requestId: string,
  requesterUserId: string
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    // Add member
    await addMemberToCircle(circleId, requesterUserId);
    // Mark request approved then delete
    const reqRef = doc(joinRequestsSubcollection(circleId), requestId);
    await firestoreUpdateDoc(reqRef, { status: 'approved' });
    await deleteDoc(reqRef);
  } catch (error) {
    console.error('Error approving join request:', error);
    throw new Error('Failed to approve request.');
  }
};

export const declineJoinRequest = async (
  circleId: string,
  requestId: string
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const reqRef = doc(joinRequestsSubcollection(circleId), requestId);
    await firestoreUpdateDoc(reqRef, { status: 'declined' });
    await deleteDoc(reqRef);
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
