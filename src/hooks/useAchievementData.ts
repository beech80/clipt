import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useAchievementData = (userId: string) => {
  return useQuery({
    queryKey: ['achievement-data', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select(`
          *,
          chain_requirement (
            id,
            name,
            description
          )
        `);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};