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
import { Circle, Update, User } from '../types';

// Collection references
const circlesRef = collection(db, 'circles');
const updatesRef = collection(db, 'updates');
const usersRef = collection(db, 'users');

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
      members: [circleData.ownerId], // Owner is automatically a member
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
      ownerId: data.ownerId,
      members: data.members || [],
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
    const docRef = await addDoc(updatesRef, {
      ...updateData,
      createdAt: serverTimestamp(),
      reactions: {},
    });
    
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
