import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AchievementCard } from './AchievementCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_url?: string;
  points: number;
  earned_at?: string;
}

export const AchievementList = ({ userId }: { userId: string }) => {
  const { data: achievements, isLoading } = useQuery({
    queryKey: ['user-achievements', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select(`
          *,
          user_achievements!inner(earned_at)
        `)
        .eq('user_achievements.user_id', userId)
        .order('points', { ascending: false });

      if (error) throw error;
      return data as Achievement[];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-[100px] w-full" />
        ))}
      </div>
    );
  }

  if (!achievements?.length) {
    return (
      <div className="text-center py-8">
        <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No achievements yet</h3>
        <p className="text-muted-foreground">Keep playing to earn achievements!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {achievements.map((achievement) => (
        <AchievementCard
          key={achievement.id}
          name={achievement.name}
          description={achievement.description}
          iconUrl={achievement.icon_url}
          points={achievement.points}
          earnedAt={achievement.earned_at}
        />
      ))}
    </div>
  );
};