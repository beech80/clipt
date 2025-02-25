
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Gamepad2, Smartphone } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { Achievement, AchievementProgress } from '@/types/profile';

interface AchievementListProps {
  userId: string;
}

export const AchievementList = ({ userId }: AchievementListProps) => {
  const { data: achievements, isLoading } = useQuery({
    queryKey: ['user-achievements', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievement_progress')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      
      // Transform the data to match our types
      return (data as any[]).map(progress => ({
        ...progress,
        completed: progress.current_value >= progress.achievement.target_value,
        achievement: {
          ...progress.achievement,
          reward_value: {
            points: progress.achievement.points
          },
          progress_type: progress.achievement.progress_type as "count" | "value" | "boolean",
          reward_type: progress.achievement.reward_type as "points" | "badge" | "title",
          category: progress.achievement.category as "gaming" | "social" | "streaming" | "general"
        }
      })) as (AchievementProgress & { achievement: Achievement })[];
    },
  });

  const getAchievementIcon = (category: string) => {
    switch (category) {
      case 'gaming':
        return <Gamepad2 className="w-12 h-12 text-green-400" />;
      default:
        return <Smartphone className="w-12 h-12 text-green-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!achievements?.length) {
    return (
      <div className="text-center py-12">
        <Gamepad2 className="w-12 h-12 mx-auto text-gray-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-400">No achievements yet</h3>
        <p className="text-gray-500">Keep playing to earn achievements!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {achievements.map((progress) => {
        const achievement = progress.achievement;
        const progressPercent = Math.min(100, (progress.current_value / achievement.target_value) * 100);

        return (
          <div
            key={achievement.id}
            className={`
              relative overflow-hidden rounded-lg border border-gray-800 p-6
              ${progress.completed ? 'bg-gray-900/50' : 'bg-gray-900/30'}
              hover:bg-gray-900/60 transition-all duration-200
            `}
          >
            <div className="flex gap-6">
              {/* Icon Section */}
              <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center">
                {getAchievementIcon(achievement.category)}
              </div>

              {/* Content Section */}
              <div className="flex-1 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {achievement.name}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {achievement.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-green-400 font-bold">+{achievement.points} pts</span>
                    {progress.completed && (
                      <p className="text-xs text-gray-500 mt-1">
                        Completed {new Date(progress.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Progress Section */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-gray-400">
                      {progress.current_value} / {achievement.target_value}
                    </span>
                  </div>
                  <Progress 
                    value={progressPercent} 
                    className="h-2 bg-gray-800"
                    indicatorClassName="bg-gradient-to-r from-green-500 to-emerald-400"
                  />
                </div>

                {/* How to Obtain */}
                <div className="pt-2 border-t border-gray-800">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium text-gray-400">How to obtain: </span>
                    {achievement.category === 'gaming' 
                      ? `Play games and accumulate ${achievement.target_value} points in gaming sessions.`
                      : `Engage in ${achievement.category} activities and reach ${achievement.target_value} interactions.`
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Completion Overlay */}
            {progress.completed && (
              <div className="absolute top-4 right-4">
                <div className="bg-green-500/20 rounded-full p-1">
                  <svg
                    className="w-5 h-5 text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
