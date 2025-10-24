// Firestore utilities for circle management
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
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
import { db } from './firebase';
import { Circle, Update, User, Comment } from '../types';

// Collection references
const circlesRef = collection(db, 'circles');
const updatesRef = collection(db, 'updates');
const usersRef = collection(db, 'users');
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
      roles: data.roles || {},
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Error getting circle:', error);
    throw new Error('Failed to fetch circle. Please try again.');
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
    await updateDoc(circleDoc, {
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

    await updateDoc(circleDoc, {
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
    
    await updateDoc(circleDoc, {
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
    return circle?.roles?.[userId] || null;
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
    
    await updateDoc(circleDoc, {
      [`roles.${userId}`]: 'owner',
      ownerIds: updatedOwnerIds,
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
    
    await updateDoc(circleDoc, {
      [`roles.${userId}`]: 'member',
      ownerIds: updatedOwnerIds,
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
    await updateDoc(circleDoc, {
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

    await updateDoc(userDoc, {
      circlesMuted: updatedMuted,
    });
  } catch (error) {
    console.error('Error toggling circle mute:', error);
    throw new Error('Failed to update notification settings. Please try again.');
  }
};

// Update Management Functions

/**
 * Create a new update
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
    
    const docRef = await addDoc(updatesRef, updateDoc);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating update:', error);
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

// Comment Management Functions

/**
 * Create a new comment
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
    const docRef = await addDoc(commentsRef, {
      ...commentData,
      createdAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating comment:', error);
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
