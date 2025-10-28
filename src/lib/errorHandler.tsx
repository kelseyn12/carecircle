// Enhanced error handling system
import React from 'react';
import { View, Text, TouchableOpacity, Alert, DevSettings } from 'react-native';
import Toast from 'react-native-root-toast';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
  userId?: string;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  handleError(error: any, context?: string): void {
    const appError: AppError = {
      code: this.getErrorCode(error),
      message: this.getErrorMessage(error),
      details: error,
      timestamp: Date.now(),
    };

    this.logError(appError);
    this.showUserFriendlyError(appError, context);
  }

  private getErrorCode(error: any): string {
    if (error?.code) return error.code;
    if (error?.name) return error.name;
    if (error?.message?.includes('network')) return 'NETWORK_ERROR';
    if (error?.message?.includes('permission')) return 'PERMISSION_ERROR';
    if (error?.message?.includes('not found')) return 'NOT_FOUND';
    return 'UNKNOWN_ERROR';
  }

  private getErrorMessage(error: any): string {
    const code = this.getErrorCode(error);
    switch (code) {
      case 'NETWORK_ERROR':
      case 'unavailable':
        return 'Network connection is unavailable. Please check your internet connection.';
      case 'PERMISSION_ERROR':
      case 'permission-denied':
        return "You don't have permission to perform this action.";
      case 'NOT_FOUND':
      case 'not-found':
        return 'The requested item could not be found.';
      case 'already-exists':
        return 'This item already exists.';
      case 'invalid-argument':
        return 'Invalid information provided. Please check your input.';
      case 'unauthenticated':
        return 'Please sign in to continue.';
      case 'quota-exceeded':
        return 'Storage limit reached. Please contact support.';
      default:
        return error?.message || 'Something went wrong. Please try again.';
    }
  }

  private logError(error: AppError): void {
    this.errorLog.push(error);
    console.error('App Error:', error);
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }
  }

  private showUserFriendlyError(error: AppError, context?: string): void {
    const title = context ? `${context} Error` : 'Error';
    if (error.code === 'NETWORK_ERROR' || error.code === 'unavailable') {
      Toast.show(error.message, {
        duration: Toast.durations.LONG,
        position: Toast.positions.BOTTOM,
        backgroundColor: '#fef2f2',
        textColor: '#dc2626',
      });
      return;
    }

    Alert.alert(title, error.message, [{ text: 'OK', style: 'default' }]);
  }

  getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  clearErrorLog(): void {
    this.errorLog = [];
  }

  async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt === maxRetries) {
          throw error;
        }
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms delay`);
      }
    }
    throw lastError;
  }
}

export const handleError = (error: any, context?: string): void => {
  const handler = ErrorHandler.getInstance();
  handler.handleError(error, context);
};

export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries?: number,
  baseDelay?: number
): Promise<T> => {
  const handler = ErrorHandler.getInstance();
  return handler.retryOperation(operation, maxRetries, baseDelay);
};

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    handleError(error, 'React Error Boundary');
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error as Error} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error: Error }> = ({ error }) => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f9fafb',
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: '#dc2626',
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        Something went wrong
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: '#6b7280',
          textAlign: 'center',
          marginBottom: 20,
        }}
      >
        {error.message}
      </Text>
      <TouchableOpacity
        style={{
          backgroundColor: '#3b82f6',
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 8,
        }}
        onPress={() => DevSettings.reload()}
      >
        <Text
          style={{
            color: '#ffffff',
            fontWeight: '600',
          }}
        >
          Reload App
        </Text>
      </TouchableOpacity>
    </View>
  );
};


