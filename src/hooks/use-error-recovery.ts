import { useState, useCallback } from 'react';
import { useErrorHandler } from './use-error-handler';
import { toast } from 'sonner';

interface ErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onSuccess?: () => void;
  onFinalFailure?: () => void;
}

export function useErrorRecovery(options: ErrorRecoveryOptions = {}) {
  const { maxRetries = 3, retryDelay = 1000, onSuccess, onFinalFailure } = options;
  const [retryCount, setRetryCount] = useState(0);
  const { handleError } = useErrorHandler();

  const handleRetry = useCallback(async (operation: () => Promise<any>) => {
    try {
      const result = await operation();
      setRetryCount(0);
      onSuccess?.();
      return result;
    } catch (error) {
      if (retryCount < maxRetries) {
        toast.error(`Operation failed. Retrying... (${retryCount + 1}/${maxRetries})`);
        setRetryCount(prev => prev + 1);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return handleRetry(operation);
      } else {
        handleError(error as Error, 'Operation failed after multiple retries');
        onFinalFailure?.();
        setRetryCount(0);
        throw error;
      }
    }
  }, [retryCount, maxRetries, retryDelay, handleError, onSuccess, onFinalFailure]);

  const reset = useCallback(() => {
    setRetryCount(0);
  }, []);

  return {
    handleRetry,
    retryCount,
    reset,
    hasRetriesLeft: retryCount < maxRetries
  };
}