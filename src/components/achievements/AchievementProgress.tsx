import { Progress } from "@/components/ui/progress";
import { Trophy, Flame, Star } from "lucide-react";
import { useAchievementProgress } from "@/hooks/useAchievementProgress";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const AchievementProgress = () => {
  const { user } = useAuth();
  const { progress, isLoading } = useAchievementProgress(user?.id || '');

  const { data: streaks } = useQuery({
    queryKey: ['achievement-streaks', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievement_streaks')
        .select(`
          current_streak,
          max_streak,
          achievements (
            name
          )
        `)
        .eq('user_id', user?.id)
        .order('current_streak', { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  if (isLoading || !progress) {
    return null;
  }

  const inProgressAchievements = progress.filter(
    p => p.current_value < (p.achievement?.target_value || 0)
  );

  if (inProgressAchievements.length === 0 && !streaks?.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      {streaks?.length > 0 && (
        <div className="flex gap-4">
          {streaks.map((streak, i) => (
            <Card key={i} className="flex-1 p-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">{streak.achievements?.name}</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>{streak.current_streak}x Streak</span>
                    <span>•</span>
                    <span>Best: {streak.max_streak}x</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {inProgressAchievements.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Achievement Progress</h3>
          </div>
          
          <div className="space-y-4">
            {inProgressAchievements.map((p) => (
              <Card key={p.id} className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{p.achievement?.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {p.achievement?.reward_value?.points > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4" />
                            <span>{p.achievement?.reward_value.points} points</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {p.current_value} / {p.achievement?.target_value}
                    </span>
                  </div>
                  <Progress 
                    value={(p.current_value / (p.achievement?.target_value || 1)) * 100} 
                    className="h-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    {p.achievement?.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};