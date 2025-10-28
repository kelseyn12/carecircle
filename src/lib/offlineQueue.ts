// Offline queue system for storing operations when network is unavailable
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Update, Comment } from '../types';

export interface QueuedOperation {
  id: string;
  type: 'createUpdate' | 'createComment' | 'toggleReaction';
  data: any;
  timestamp: number;
  retryCount: number;
}

const QUEUE_KEY = 'offline_queue';
const MAX_RETRY_COUNT = 3;

export class OfflineQueue {
  private static instance: OfflineQueue;
  private queue: QueuedOperation[] = [];
  private isOnline: boolean = true;

  static getInstance(): OfflineQueue {
    if (!OfflineQueue.instance) {
      OfflineQueue.instance = new OfflineQueue();
    }
    return OfflineQueue.instance;
  }

  private constructor() {
    this.loadQueue();
  }

  // Load queue from AsyncStorage
  private async loadQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
    }
  }

  // Save queue to AsyncStorage
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  // Set online/offline status
  setOnlineStatus(isOnline: boolean): void {
    this.isOnline = isOnline;
    if (isOnline) {
      this.processQueue();
    }
  }

  // Add operation to queue
  async addOperation(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const queuedOperation: QueuedOperation = {
      ...operation,
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(queuedOperation);
    await this.saveQueue();

    // If online, try to process immediately
    if (this.isOnline) {
      this.processQueue();
    }
  }

  // Process all queued operations
  private async processQueue(): Promise<void> {
    if (!this.isOnline || this.queue.length === 0) return;

    const operationsToProcess = [...this.queue];
    this.queue = [];

    for (const operation of operationsToProcess) {
      try {
        await this.executeOperation(operation);
        console.log('Successfully processed offline operation:', operation.id);
      } catch (error) {
        console.error('Failed to process offline operation:', operation.id, error);
        
        // Increment retry count
        operation.retryCount++;
        
        // If retry count is exceeded, remove from queue
        if (operation.retryCount >= MAX_RETRY_COUNT) {
          console.warn('Max retries exceeded for operation:', operation.id);
          continue;
        }
        
        // Add back to queue for retry
        this.queue.push(operation);
      }
    }

    await this.saveQueue();
  }

  // Execute a single operation
  private async executeOperation(operation: QueuedOperation): Promise<void> {
    switch (operation.type) {
      case 'createUpdate':
        await this.executeCreateUpdate(operation.data);
        break;
      case 'createComment':
        await this.executeCreateComment(operation.data);
        break;
      case 'toggleReaction':
        await this.executeToggleReaction(operation.data);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  // Execute create update operation
  private async executeCreateUpdate(data: any): Promise<void> {
    const { createUpdate } = await import('../lib/firestoreUtils');
    await createUpdate(data);
  }

  // Execute create comment operation
  private async executeCreateComment(data: any): Promise<void> {
    const { createComment } = await import('../lib/firestoreUtils');
    await createComment(data);
  }

  // Execute toggle reaction operation
  private async executeToggleReaction(data: any): Promise<void> {
    const { toggleReaction } = await import('../lib/firestoreUtils');
    await toggleReaction(data.updateId, data.userId, data.emoji);
  }

  // Get queue status
  getQueueStatus(): { count: number; operations: QueuedOperation[] } {
    return {
      count: this.queue.length,
      operations: [...this.queue],
    };
  }

  // Clear queue (for testing or manual cleanup)
  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
  }
}

// Convenience functions
export const addOfflineUpdate = async (updateData: any): Promise<void> => {
  const queue = OfflineQueue.getInstance();
  await queue.addOperation({
    type: 'createUpdate',
    data: updateData,
  });
};

export const addOfflineComment = async (commentData: any): Promise<void> => {
  const queue = OfflineQueue.getInstance();
  await queue.addOperation({
    type: 'createComment',
    data: commentData,
  });
};

export const addOfflineReaction = async (reactionData: any): Promise<void> => {
  const queue = OfflineQueue.getInstance();
  await queue.addOperation({
    type: 'toggleReaction',
    data: reactionData,
  });
};

export const setOnlineStatus = (isOnline: boolean): void => {
  const queue = OfflineQueue.getInstance();
  queue.setOnlineStatus(isOnline);
};

export const getOfflineQueueStatus = () => {
  const queue = OfflineQueue.getInstance();
  return queue.getQueueStatus();
};
