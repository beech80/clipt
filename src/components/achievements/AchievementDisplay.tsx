import React from 'react';
import { Trophy, Users, Video, Heart, MessageSquare, Share2, UserPlus, Award } from 'lucide-react';

// Define achievement categories
export const ACHIEVEMENT_CATEGORIES = {
  trophy: {
    title: '🏆 Trophy & Leaderboard',
    description: 'Achievements for viral content & leaderboard success',
    icon: Trophy
  },
  social: {
    title: '📈 Follower & Engagement',
    description: 'Building a strong fanbase and community',
    icon: Users
  },
  streaming: {
    title: '🎥 Streaming',
    description: 'Rewards for streaming growth and success',
    icon: Video
  },
  engagement: {
    title: '1️⃣ Engagement Booster',
    description: 'Encouraging others to interact with content',
    icon: MessageSquare
  },
  sharing: {
    title: '2️⃣ Sharing & Promotion',
    description: 'Spreading Clipt & content across the platform',
    icon: Share2
  },
  collab: {
    title: '3️⃣ Collab & Creator Support',
    description: 'Helping other creators grow and succeed',
    icon: UserPlus
  },
  special: {
    title: '4️⃣ Special Achievements',
    description: 'Secret and fun rewards',
    icon: Award
  },
  daily: {
    title: '📅 Daily Quests',
    description: 'Daily challenges to complete',
    icon: Award
  },
  general: {
    title: 'General',
    description: 'General platform achievements',
    icon: Award
  }
};

type AchievementDisplayProps = {
  achievements: any[];
  filter?: string | null;
};

export const AchievementDisplay: React.FC<AchievementDisplayProps> = ({ 
  achievements,
  filter = null 
}) => {
  // Group achievements by category
  const groupedAchievements = React.useMemo(() => {
    return achievements.reduce((acc: Record<string, any[]>, achievement) => {
      // Use the achievement's category or default to 'general'
      const category = achievement.achievement?.category || 'general';
      
      if (!acc[category]) {
        acc[category] = [];
      }
      
      acc[category].push(achievement);
      return acc;
    }, {});
  }, [achievements]);

  // If a filter is provided, only show that category
  const categoriesToShow = filter 
    ? (groupedAchievements[filter] ? [filter] : []) 
    : Object.keys(groupedAchievements);

  if (achievements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <Trophy className="h-12 w-12 mb-4 text-gray-300" />
        <p>No achievements available</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {categoriesToShow.map(category => {
        if (!groupedAchievements[category]?.length) return null;
        
        const CategoryIcon = ACHIEVEMENT_CATEGORIES[category as keyof typeof ACHIEVEMENT_CATEGORIES]?.icon || Award;
        const categoryTitle = ACHIEVEMENT_CATEGORIES[category as keyof typeof ACHIEVEMENT_CATEGORIES]?.title || category;
        const categoryDescription = ACHIEVEMENT_CATEGORIES[category as keyof typeof ACHIEVEMENT_CATEGORIES]?.description || '';
        
        return (
          <div key={category} className="mb-8">
            {/* Category header */}
            <div className="mb-4 border-b border-indigo-800 pb-2">
              <div className="flex items-center gap-2">
                <CategoryIcon className="h-6 w-6 text-indigo-400" />
                <h2 className="text-xl font-bold text-white">{categoryTitle}</h2>
              </div>
              <p className="text-gray-300 text-sm mt-1">{categoryDescription}</p>
            </div>
            
            {/* Achievement cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {groupedAchievements[category].map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border ${
                    achievement.completed
                      ? 'bg-indigo-900/50 border-indigo-500'
                      : 'bg-gray-800/50 border-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-md overflow-hidden flex-shrink-0 bg-indigo-900 flex items-center justify-center">
                      {achievement.achievement?.image ? (
                        <img
                          src={achievement.achievement.image}
                          alt={achievement.achievement.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/200/311b92/ffffff?text=🏆";
                          }}
                        />
                      ) : (
                        <Trophy className="h-8 w-8 text-indigo-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold">
                        {achievement.achievement?.name}
                        {achievement.completed && (
                          <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                            COMPLETED
                          </span>
                        )}
                      </h3>
                      <p className="text-gray-300 text-sm mt-1">{achievement.achievement?.description}</p>

                      {/* Progress bar */}
                      {achievement.achievement?.target_value && (
                        <div className="mt-2">
                          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${achievement.completed ? 'bg-green-500' : 'bg-indigo-500'}`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  (achievement.currentValue / achievement.achievement.target_value) * 100
                                )}%`
                              }}
                            />
                          </div>
                          <div className="text-xs text-gray-400 mt-1 flex justify-between">
                            <span>{achievement.currentValue} / {achievement.achievement.target_value}</span>
                            <span>{Math.round((achievement.currentValue / achievement.achievement.target_value) * 100)}%</span>
                          </div>
                        </div>
                      )}

                      {/* Reward */}
                      {achievement.achievement?.reward_type && (
                        <div className="text-xs text-indigo-300 mt-2 flex items-center">
                          <Award className="h-3 w-3 mr-1" />
                          {achievement.achievement.reward_type === 'points' && (
                            <span>Reward: {achievement.achievement.points} points</span>
                          )}
                          {achievement.achievement.reward_type === 'badge' && (
                            <span>Reward: Special Badge</span>
                          )}
                          {achievement.achievement.reward_type === 'title' && (
                            <span>Reward: Unique Title</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AchievementDisplay;
