import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

interface AppState {
  isLoading: boolean;
  error: string | null;
  optimisticUpdates: Map<string, any>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addOptimisticUpdate: (key: string, data: any) => void;
  removeOptimisticUpdate: (key: string) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      isLoading: false,
      error: null,
      optimisticUpdates: new Map(),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      addOptimisticUpdate: (key, data) =>
        set((state) => {
          const newUpdates = new Map(state.optimisticUpdates);
          newUpdates.set(key, data);
          return { optimisticUpdates: newUpdates };
        }),
      removeOptimisticUpdate: (key) =>
        set((state) => {
          const newUpdates = new Map(state.optimisticUpdates);
          newUpdates.delete(key);
          return { optimisticUpdates: newUpdates };
        }),
    }),
    { name: 'app-store' }
  )
);

// Type-safe action creators
export const createAsyncAction = <T, R>(
  action: (payload: T) => Promise<R>,
  options: {
    optimisticKey?: string;
    optimisticData?: any;
    onSuccess?: (data: R) => void;
    onError?: (error: Error) => void;
  } = {}
) => {
  return async (payload: T) => {
    const store = useAppStore.getState();
    const { optimisticKey, optimisticData, onSuccess, onError } = options;

    try {
      store.setLoading(true);
      store.setError(null);

      if (optimisticKey && optimisticData) {
        store.addOptimisticUpdate(optimisticKey, optimisticData);
      }

      const result = await action(payload);

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      store.setError(errorMessage);
      
      if (onError && error instanceof Error) {
        onError(error);
      }
      
      throw error;
    } finally {
      store.setLoading(false);
      if (optimisticKey) {
        store.removeOptimisticUpdate(optimisticKey);
      }
    }
  };
};