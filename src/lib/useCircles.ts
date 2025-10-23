// Custom hook for circle management
import { useState, useEffect, useCallback } from 'react';
import { Circle } from '../types';
import { 
  getUserCircles, 
  createCircle, 
  updateCircle, 
  deleteCircle,
  subscribeToUserCircles 
} from './firestoreUtils';
import { useAuth } from './authContext';

export const useCircles = () => {
  const { user } = useAuth();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load circles on mount and when user changes
  useEffect(() => {
    if (!user) {
      setCircles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Set up real-time subscription
    const unsubscribe = subscribeToUserCircles(user.id, (circlesData) => {
      setCircles(circlesData);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  // Create a new circle
  const createNewCircle = useCallback(async (title: string): Promise<string> => {
    if (!user) {
      throw new Error('User must be logged in to create a circle');
    }

    try {
      setError(null);
      const circleId = await createCircle({
        title,
        ownerId: user.id,
      });
      
      // The real-time listener will automatically update the circles list
      return circleId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create circle';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  // Update circle
  const updateCircleData = useCallback(async (
    circleId: string, 
    updates: Partial<Pick<Circle, 'title' | 'members'>>
  ): Promise<void> => {
    try {
      setError(null);
      await updateCircle(circleId, updates);
      // The real-time listener will automatically update the circles list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update circle';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Delete circle
  const removeCircle = useCallback(async (circleId: string): Promise<void> => {
    if (!user) {
      throw new Error('User must be logged in to delete a circle');
    }

    try {
      setError(null);
      await deleteCircle(circleId);
      // The real-time listener will automatically update the circles list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete circle';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  // Refresh circles manually
  const refreshCircles = useCallback(async () => {
    if (!user) {
      setCircles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const circlesData = await getUserCircles(user.id);
      setCircles(circlesData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch circles';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    circles,
    loading,
    error,
    createNewCircle,
    updateCircleData,
    removeCircle,
    refreshCircles,
  };
};
