import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AchievementCard } from './AchievementCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Star, Award } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from '@/components/ui/card';

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[200px] w-full" />
        ))}
      </div>
    );
  }

  if (!achievements?.length) {
    return (
      <Card className="p-12 text-center">
        <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No achievements yet</h3>
        <p className="text-muted-foreground">Keep playing to earn achievements!</p>
      </Card>
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
          <TabsTrigger value="other">
            <Star className="w-4 h-4 mr-2" />
            Other Achievements
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="trophies" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
          </div>
        </TabsContent>

        <TabsContent value="other" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};