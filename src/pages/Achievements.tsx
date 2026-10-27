
import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Trophy, Gamepad2, Users, Radio } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';

export default function Achievements() {
  const { user } = useAuth();

  const progressQuery = useQuery({
    queryKey: ['achievement-progress', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievement_progress')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', user?.id)
        // React Query owns retries; avoid multiplying its backoff with SDK retries.
        .retry(false);

      if (error) throw error;
      return data.map(progress => ({
        ...progress,
        completed: !!progress.achievement && progress.current_value >= progress.achievement.target_value,
      }));
    },
    enabled: !!user?.id,
  });

  const achievementsQuery = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('category', { ascending: true })
        .order('points', { ascending: false })
        .retry(false);

      if (error) throw error;
      return data;
    },
  });

  const achievementProgress = progressQuery.data;
  const achievements = achievementsQuery.data;
  const unavailable = progressQuery.isError || achievementsQuery.isError;
  const pending = progressQuery.isPending || achievementsQuery.isPending;

  if (unavailable) return <main className="container max-w-3xl p-6 pb-40 space-y-4">
    <h1 className="text-3xl font-bold">Achievements</h1>
    <p role="alert">Unable to load your achievements. Your progress has not been reset.</p>
    <Button onClick={() => { void progressQuery.refetch(); void achievementsQuery.refetch(); }}>Retry</Button>
  </main>;
  if (pending) return <main className="container p-6 pb-40"><h1 className="text-3xl font-bold">Achievements</h1>
    <p role="status">Loading your achievements…</p></main>;

  const renderAchievementIcon = (category: string) => {
    switch (category) {
      case 'gaming':
        return <Gamepad2 className="w-6 h-6 text-green-500" />;
      case 'social':
        return <Users className="w-6 h-6 text-blue-500" />;
      case 'streaming':
        return <Radio className="w-6 h-6 text-purple-500" />;
      default:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'gaming':
        return 'text-green-500';
      case 'social':
        return 'text-blue-500';
      case 'streaming':
        return 'text-purple-500';
      default:
        return 'text-yellow-500';
    }
  };

  const getProgressForAchievement = (achievementId: string) => {
    return achievementProgress?.find(p => p.achievement_id === achievementId);
  };

  const totalPoints = achievementProgress?.reduce((sum, progress) => {
    if (progress.completed) {
      return sum + (progress.achievement?.points || 0);
    }
    return sum;
  }, 0) || 0;

  return (
    <div className="clipt-achievements container max-w-6xl mx-auto p-4 sm:p-6 space-y-8">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-4 gaming-card p-5">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="w-8 h-8 text-yellow-500" />
              Achievements
            </h1>
            <p className="text-muted-foreground">Track your progress and earn rewards</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-yellow-500">{totalPoints} pts</p>
            <p className="text-sm text-muted-foreground">Total Points Earned</p>
          </div>
        </div>
        <Separator />
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="streaming">Streaming</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="gaming">Gaming</TabsTrigger>
        </TabsList>

        {['all', 'streaming', 'social', 'gaming'].map(category => (
          <TabsContent key={category} value={category} className="clipt-achievement-catalog">
            {achievements
              ?.filter(a => category === 'all' || a.category === category)
              .map(achievement => {
                const progress = getProgressForAchievement(achievement.id);
                const progressPercent = progress && achievement.target_value > 0
                  ? (progress.current_value / achievement.target_value) * 100
                  : 0;

                return (
                  <Card key={achievement.id} className={`p-6 ${progress?.completed ? 'bg-gradient-to-br from-gray-900/50 to-gray-800/50' : ''}`}>
                    <div className="space-y-4 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          {renderAchievementIcon(achievement.category)}
                          <div className="min-w-0 [overflow-wrap:anywhere]">
                            <h3 className="font-semibold">{achievement.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {achievement.description}
                            </p>
                            <p className={`text-xs ${getCategoryColor(achievement.category)} mt-1`}>
                              {achievement.category.charAt(0).toUpperCase() + achievement.category.slice(1)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-purple-500">
                            {achievement.points} pts
                          </span>
                          {progress?.completed && (
                            <p className="text-xs text-muted-foreground">
                              Completed
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{progress?.completed ? 'Completed!' : 'Progress'}</span>
                          <span>{Math.min(100, Math.round(progressPercent))}%</span>
                        </div>
                        <Progress 
                          aria-label={`${achievement.name} progress`}
                          value={Math.min(100, progressPercent)} 
                          className={`h-2 ${progress?.completed ? 'bg-purple-900/20' : ''}`}
                        />
                        <p className="text-xs text-muted-foreground">
                          {progress?.current_value || 0} / {achievement.target_value} {achievement.progress_type === 'count' ? 'times' : 'points'}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
              
            {achievements?.filter(a => category === 'all' || a.category === category).length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No achievements found in this category</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
