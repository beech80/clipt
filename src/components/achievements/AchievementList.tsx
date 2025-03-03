import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Star, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { Achievement, AchievementProgress } from '@/types/profile';

interface AchievementListProps {
  userId: string;
}

const AchievementList: React.FC<AchievementListProps> = ({ userId }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const categories = [
    { id: 'streaming', label: 'Streaming' },
    { id: 'social', label: 'Social' },
    { id: 'general', label: 'General' }
  ];

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
      
      // Transform and sort the data
      const transformedData = (data as any[]).map(progress => ({
        ...progress,
        completed: progress.current_value >= progress.achievement.target_value,
        achievement: {
          ...progress.achievement,
          reward_value: {
            points: progress.achievement.points
          },
          progress_type: progress.achievement.progress_type as "count" | "value" | "boolean",
          reward_type: progress.achievement.reward_type as "points" | "badge" | "title",
          category: progress.achievement.category as "streaming" | "social" | "general"
        }
      })) as (AchievementProgress & { achievement: Achievement })[];

      // Sort by category and completion status
      return transformedData.sort((a, b) => {
        if (a.completed === b.completed) {
          // If same completion status, sort by category
          if (a.achievement.category === b.achievement.category) {
            // If same category, sort by points (higher first)
            return b.achievement.points - a.achievement.points;
          }
          return a.achievement.category.localeCompare(b.achievement.category);
        }
        // Completed achievements go after incomplete ones
        return a.completed ? 1 : -1;
      });
    },
  });

  // Filter achievements by category
  const filteredAchievements = React.useMemo(() => {
    if (!achievements) return [];
    
    return selectedCategory
      ? achievements.filter(a => a.achievement.category === selectedCategory)
      : achievements;
  }, [achievements, selectedCategory]);

  // Group achievements by in-progress and completed
  const groupedAchievements = React.useMemo(() => {
    if (!filteredAchievements.length) return { inProgress: [], completed: [] };
    
    return {
      inProgress: filteredAchievements.filter(a => !a.completed),
      completed: filteredAchievements.filter(a => a.completed)
    };
  }, [filteredAchievements]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Category filter tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2 categories-scroll">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium ${
            selectedCategory === null
              ? 'bg-blue-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          All
        </button>
        
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium ${
              selectedCategory === category.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* In Progress Achievements */}
      {groupedAchievements.inProgress.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-md font-semibold text-gray-400 uppercase">In Progress</h3>
          <div className="space-y-3">
            {groupedAchievements.inProgress.map((achievementProgress, index) => (
              <div
                key={achievementProgress.id}
                className={`
                  relative overflow-hidden rounded-lg border border-gray-800 p-6
                  ${achievementProgress.completed ? 'bg-gray-900/50' : 'bg-gray-900/30'}
                  hover:bg-gray-900/60 transition-all duration-200
                `}
              >
                <div className="flex gap-6">
                  {/* Icon Section */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center">
                    {achievementProgress.achievement.category === 'streaming' ? (
                      <Star className="w-12 h-12 text-purple-400" />
                    ) : achievementProgress.achievement.category === 'social' ? (
                      <Users className="w-12 h-12 text-blue-400" />
                    ) : (
                      <Trophy className="w-12 h-12 text-amber-400" />
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {achievementProgress.achievement.name}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {achievementProgress.achievement.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-green-400 font-bold">+{achievementProgress.achievement.points} pts</span>
                        {achievementProgress.completed && (
                          <p className="text-xs text-gray-500 mt-1">
                            Completed {new Date(achievementProgress.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Progress Section */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-gray-400">
                          {achievementProgress.current_value} / {achievementProgress.achievement.target_value}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(100, (achievementProgress.current_value / achievementProgress.achievement.target_value) * 100)} 
                        className="h-2 bg-gray-800"
                        indicatorClassName={achievementProgress.completed 
                          ? "bg-gradient-to-r from-green-500 to-emerald-400"
                          : "bg-gradient-to-r from-purple-500 to-blue-400"
                        }
                      />
                    </div>

                    {/* Category Tag */}
                    <div className="pt-2 border-t border-gray-800">
                      <span className={`
                        inline-block px-2 py-1 rounded-full text-xs font-medium
                        ${achievementProgress.achievement.category === 'streaming' ? 'bg-purple-500/20 text-purple-400' :
                          achievementProgress.achievement.category === 'social' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-amber-500/20 text-amber-400'}
                      `}>
                        {achievementProgress.achievement.category.charAt(0).toUpperCase() + achievementProgress.achievement.category.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Completion Overlay */}
                {achievementProgress.completed && (
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
            ))}
          </div>
        </div>
      )}

      {/* Completed Achievements */}
      {groupedAchievements.completed.length > 0 && (
        <div className="space-y-3 mt-6">
          <h3 className="text-md font-semibold text-gray-400 uppercase">Completed</h3>
          <div className="space-y-3">
            {groupedAchievements.completed.map((achievementProgress, index) => (
              <div
                key={achievementProgress.id}
                className={`
                  relative overflow-hidden rounded-lg border border-gray-800 p-6
                  ${achievementProgress.completed ? 'bg-gray-900/50' : 'bg-gray-900/30'}
                  hover:bg-gray-900/60 transition-all duration-200
                `}
              >
                <div className="flex gap-6">
                  {/* Icon Section */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center">
                    {achievementProgress.achievement.category === 'streaming' ? (
                      <Star className="w-12 h-12 text-purple-400" />
                    ) : achievementProgress.achievement.category === 'social' ? (
                      <Users className="w-12 h-12 text-blue-400" />
                    ) : (
                      <Trophy className="w-12 h-12 text-amber-400" />
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {achievementProgress.achievement.name}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {achievementProgress.achievement.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-green-400 font-bold">+{achievementProgress.achievement.points} pts</span>
                        {achievementProgress.completed && (
                          <p className="text-xs text-gray-500 mt-1">
                            Completed {new Date(achievementProgress.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Progress Section */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-gray-400">
                          {achievementProgress.current_value} / {achievementProgress.achievement.target_value}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(100, (achievementProgress.current_value / achievementProgress.achievement.target_value) * 100)} 
                        className="h-2 bg-gray-800"
                        indicatorClassName={achievementProgress.completed 
                          ? "bg-gradient-to-r from-green-500 to-emerald-400"
                          : "bg-gradient-to-r from-purple-500 to-blue-400"
                        }
                      />
                    </div>

                    {/* Category Tag */}
                    <div className="pt-2 border-t border-gray-800">
                      <span className={`
                        inline-block px-2 py-1 rounded-full text-xs font-medium
                        ${achievementProgress.achievement.category === 'streaming' ? 'bg-purple-500/20 text-purple-400' :
                          achievementProgress.achievement.category === 'social' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-amber-500/20 text-amber-400'}
                      `}>
                        {achievementProgress.achievement.category.charAt(0).toUpperCase() + achievementProgress.achievement.category.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Completion Overlay */}
                {achievementProgress.completed && (
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementList;
