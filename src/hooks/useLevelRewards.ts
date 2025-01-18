import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface LevelReward {
  id: string;
  level: number;
  reward_type: string;
  reward_value: {
    points?: number;
    achievement_id?: string;
    item_id?: string;
  };
}

export const useLevelRewards = (level: number) => {
  return useQuery({
    queryKey: ['level-rewards', level],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('level_rewards')
        .select('*')
        .eq('level', level)
        .single();

      if (error) throw error;
      return data as LevelReward;
    },
    enabled: !!level,
  });
};