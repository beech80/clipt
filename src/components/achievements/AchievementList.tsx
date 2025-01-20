import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AchievementCard } from './AchievementCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_url?: string;
  points: number;
  earned_at?: string;
  category: string;
}

interface AchievementListProps {
  userId: string;
  filter?: 'all' | 'in-progress' | 'completed';
}

export const AchievementList = ({ userId, filter = 'all' }: AchievementListProps) => {
  const { data: achievements, isLoading } = useQuery({
    queryKey: ['user-achievements', userId, filter],
    queryFn: async () => {
      let query = supabase
        .from('achievements')
        .select(`
          *,
          user_achievements!inner(earned_at)
        `)
        .eq('user_achievements.user_id', userId);

      if (filter === 'completed') {
        query = query.not('user_achievements.earned_at', 'is', null);
      } else if (filter === 'in-progress') {
        query = query.is('user_achievements.earned_at', null);
      }

      query = query.order('points', { ascending: false });

      const { data, error } = await query;
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

  const trophyAchievements = achievements.filter(a => a.category === 'trophies');
  const otherAchievements = achievements.filter(a => a.category !== 'trophies');

  return (
    <div className="space-y-6">
      <Tabs defaultValue="trophies" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="trophies" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Trophies
          </TabsTrigger>
          <TabsTrigger value="other">Other Achievements</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trophies" className="space-y-4 mt-4">
          {trophyAchievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievementId={achievement.id}
              name={achievement.name}
              description={achievement.description}
              iconUrl={achievement.icon_url}
              points={achievement.points}
              earnedAt={achievement.earned_at}
              showChain={true}
            />
          ))}
        </TabsContent>

        <TabsContent value="other" className="space-y-4 mt-4">
          {otherAchievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievementId={achievement.id}
              name={achievement.name}
              description={achievement.description}
              iconUrl={achievement.icon_url}
              points={achievement.points}
              earnedAt={achievement.earned_at}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};