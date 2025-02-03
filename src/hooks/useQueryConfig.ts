import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useQueryConfig = () => {
  const queryClient = useQueryClient();

  const prefetchQuery = useCallback(async (queryKey: string[], queryFn: () => Promise<any>) => {
    await queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: 1000 * 60 * 5 // 5 minutes
    });
  }, [queryClient]);

  const invalidateQueries = useCallback((queryKey: string[]) => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient]);

  const setQueryData = useCallback((queryKey: string[], data: any) => {
    queryClient.setQueryData(queryKey, data);
  }, [queryClient]);

  return {
    prefetchQuery,
    invalidateQueries,
    setQueryData
  };
};