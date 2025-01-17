import { useCallback } from 'react';
import { toast } from 'sonner';
import { errorLogger } from '@/utils/errorLogger';

export const useErrorHandler = () => {
  const handleError = useCallback((error: Error, context?: string) => {
    // Log the error
    errorLogger.log(error, 'medium', { context });

    // Show user-friendly message
    toast.error(error.message || 'An unexpected error occurred');

    // You can add additional error handling logic here
    if (error.message.includes('unauthorized')) {
      // Handle auth errors
    } else if (error.message.includes('network')) {
      // Handle network errors
    }
  }, []);

  return { handleError };
};