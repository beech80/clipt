
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
      return data as (AchievementProgress & { achievement: Achievement })[];
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
    <div className="space-y-2">
      {achievements.map((progress) => {
        const achievement = progress.achievement;
        const progressPercent = Math.min(100, (progress.current_value / achievement.target_value) * 100);

        return (
          <div
            key={achievement.id}
            className={`
              relative overflow-hidden rounded-lg border border-gray-800
              ${progress.completed ? 'bg-gray-900/50' : 'bg-gray-900/30'}
              hover:bg-gray-900/60 transition-all duration-200
              shadow-[0_0_15px_rgba(0,255,0,0.1)]
            `}
          >
            <div className="p-4 flex items-center gap-4">
              <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center">
                {getAchievementIcon(achievement.category)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h3 className="font-semibold text-gray-200">
                      {achievement.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {achievement.description} - {progress.current_value}/{achievement.target_value}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-bold">+{achievement.points}</span>
                    {progress.completed && (
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-green-400"
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
                    )}
                  </div>
                </div>

                <div className="relative pt-1">
                  <Progress 
                    value={progressPercent}
                    className="h-2 bg-gray-800"
                    indicatorClassName="bg-gradient-to-r from-green-500 to-emerald-400"
                  />
                </div>
              </div>
            </div>

            {/* Glowing border effect */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `
                  linear-gradient(90deg, 
                    transparent 0%, 
                    rgba(0,255,0,0.03) 50%,
                    transparent 100%
                  )
                `
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
