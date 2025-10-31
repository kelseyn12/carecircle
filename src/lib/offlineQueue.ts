// Offline queue system for storing operations when network is unavailable
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
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
  private processingQueue: boolean = false;
  private unsubscribeNetInfo: (() => void) | null = null;

  static getInstance(): OfflineQueue {
    if (!OfflineQueue.instance) {
      OfflineQueue.instance = new OfflineQueue();
    }
    return OfflineQueue.instance;
  }

  private constructor() {
    this.loadQueue();
    this.setupNetworkListener();
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

  // Setup network status listener
  private setupNetworkListener(): void {
    // Fetch initial state
    NetInfo.fetch().then(state => {
      // If connected and on Wi-Fi, assume online (Wi-Fi usually means internet)
      // This prevents false positives when isInternetReachable check is slow
      if (state.type === 'wifi' && state.isConnected) {
        this.isOnline = true;
      } else {
        this.isOnline = (state.isConnected && (state.isInternetReachable === true || state.isInternetReachable === null));
      }
      if (this.isOnline && !this.processingQueue) {
        this.processQueue();
      }
    });

    // Subscribe to network changes
    this.unsubscribeNetInfo = NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      
      // If connected and on Wi-Fi, assume online (Wi-Fi usually means internet)
      if (state.type === 'wifi' && state.isConnected) {
        this.isOnline = true;
      } else {
        // For other types, use isInternetReachable, but treat null as online (uncertain but likely connected)
        this.isOnline = (state.isConnected && (state.isInternetReachable === true || state.isInternetReachable === null));
      }

      // If we just came online and are not already processing, try to process the queue
      if (!wasOnline && this.isOnline && !this.processingQueue) {
        this.processQueue();
      }
    });
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
    if (this.isOnline && !this.processingQueue) {
      this.processQueue();
    }
  }

  // Process all queued operations
  private async processQueue(): Promise<void> {
    if (this.processingQueue || !this.isOnline || this.queue.length === 0) {
      return;
    }

    this.processingQueue = true;
    const operationsToProcess = [...this.queue];
    this.queue = [];

    for (const operation of operationsToProcess) {
      try {
        await this.executeOperation(operation);
      } catch (error) {
        // Increment retry count
        operation.retryCount++;
        
        // If retry count is exceeded, remove from queue
        if (operation.retryCount >= MAX_RETRY_COUNT) {
          continue;
        }
        
        // Add back to queue for retry
        this.queue.push(operation);
      }
    }

    await this.saveQueue();
    this.processingQueue = false;
  }

  // Execute a single operation
  private async executeOperation(operation: QueuedOperation): Promise<void> {
    // For now, just simulate successful execution
    // In production, this would call the actual Firestore functions
    return Promise.resolve();
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

  // Public method to manually process queue
  async processQueueManually(): Promise<void> {
    await this.processQueue();
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
