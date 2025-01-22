import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

export function useAsyncState<T>(initialData: T | null = null) {
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(async <R>(
    asyncFn: () => Promise<R>,
    options: {
      onSuccess?: (data: R) => void;
      onError?: (error: Error) => void;
      successMessage?: string;
      errorMessage?: string;
    } = {}
  ) => {
    const { onSuccess, onError, successMessage, errorMessage } = options;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await asyncFn();
      setState((prev) => ({ ...prev, data: result as unknown as T, isLoading: false }));
      
      if (successMessage) {
        toast.success(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('An error occurred');
      setState((prev) => ({ ...prev, error: errorObj, isLoading: false }));
      
      if (errorMessage) {
        toast.error(errorMessage);
      }
      
      if (onError) {
        onError(errorObj);
      }
      
      throw errorObj;
    }
  }, []);

  return {
    ...state,
    execute,
    reset: () => setState({ data: initialData, isLoading: false, error: null }),
  };
}