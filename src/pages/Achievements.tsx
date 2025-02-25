
import React from 'react';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Trophy, Gamepad2, Bookmark } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { Achievement, AchievementProgress } from '@/types/profile';
import { useAuth } from '@/contexts/AuthContext';

export default function Achievements() {
  const { user } = useAuth();

  const { data: achievementProgress } = useQuery<AchievementProgress[]>({
    queryKey: ['achievement-progress', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievement_progress')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', user?.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: achievements } = useQuery<Achievement[]>({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('category', { ascending: true })
        .order('points', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const renderAchievementIcon = (category: string) => {
    switch (category) {
      case 'gaming':
        return <Gamepad2 className="w-6 h-6 text-purple-500" />;
      case 'social':
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      default:
        return <Bookmark className="w-6 h-6 text-blue-500" />;
    }
  };

  const getProgressForAchievement = (achievementId: string) => {
    return achievementProgress?.find(p => p.achievement_id === achievementId);
  };

  return (
    <div className="container mx-auto p-6 space-y-8 pb-40">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-500" />
          Achievements
        </h1>
        <p className="text-muted-foreground">Track your progress and earn rewards</p>
      </div>

      <Separator />

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="gaming">Gaming</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="streaming">Streaming</TabsTrigger>
        </TabsList>

        {['all', 'gaming', 'social', 'streaming'].map(category => (
          <TabsContent key={category} value={category} className="space-y-4">
            {achievements
              ?.filter(a => category === 'all' || a.category === category)
              .map(achievement => {
                const progress = getProgressForAchievement(achievement.id);
                const progressPercent = progress 
                  ? (progress.current_value / achievement.target_value) * 100
                  : 0;

                return (
                  <Card key={achievement.id} className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          {renderAchievementIcon(achievement.category)}
                          <div>
                            <h3 className="font-semibold">{achievement.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {achievement.description}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-purple-500">
                            {achievement.points} pts
                          </span>
                          {progress?.completed && (
                            <p className="text-xs text-muted-foreground">
                              Earned {new Date(progress.earned_at!).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{Math.round(progressPercent)}%</span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {progress?.current_value || 0} / {achievement.target_value} {achievement.progress_type === 'count' ? 'times' : 'points'}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
