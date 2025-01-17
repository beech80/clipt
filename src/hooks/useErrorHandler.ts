import { useCallback } from 'react';
import { errorLogging } from '../services/errorLogging';
import { toast } from "sonner";

export const useErrorHandler = () => {
  const handleError = useCallback((error: unknown, context?: string) => {
    if (error instanceof Error) {
      errorLogging.logError(error, { 
        message: error.message,
        additionalInfo: { context } 
      });
    } else {
      const genericError = new Error(
        typeof error === 'string' ? error : 'An unexpected error occurred'
      );
      errorLogging.logError(genericError, { 
        message: genericError.message,
        additionalInfo: { context } 
      });
    }
  }, []);

  const handleWarning = useCallback((message: string, details?: Record<string, unknown>) => {
    errorLogging.logWarning(message, details);
  }, []);

  return {
    handleError,
    handleWarning,
  };
};