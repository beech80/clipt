import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface AchievementProgress {
  id: string;
  user_id: string;
  achievement_id: string;
  current_value: number;
  created_at: string;
  updated_at: string;
  achievement?: {
    name: string;
    description: string;
    target_value: number;
    progress_type: string;
    reward_type: string;
    reward_value: {
      points: number;
    };
    chain_requirement?: {
      id: string;
      name: string;
      description: string;
    };
  };
}

export const useAchievementProgress = (userId: string) => {
  const queryClient = useQueryClient();

  const { data: progress, isLoading } = useQuery({
    queryKey: ['achievement-progress', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievement_progress')
        .select(`
          *,
          achievement:achievements(
            name,
            description,
            target_value,
            progress_type,
            reward_type,
            reward_value,
            chain_requirement (
              id,
              name,
              description
            )
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;
      return data as AchievementProgress[];
    },
    enabled: !!userId,
  });

  const updateProgress = useMutation({
    mutationFn: async ({
      achievementId,
      value,
    }: {
      achievementId: string;
      value: number;
    }) => {
      const { data: existing, error: fetchError } = await supabase
        .from('achievement_progress')
        .select('id, current_value')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        const { error } = await supabase
          .from('achievement_progress')
          .update({ 
            current_value: value,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('achievement_progress')
          .insert({
            user_id: userId,
            achievement_id: achievementId,
            current_value: value,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievement-progress'] });
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
    },
    onError: () => {
      toast.error('Failed to update achievement progress');
    },
  });

  return {
    progress,
    isLoading,
    updateProgress,
  };
};