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

  // Calculate total gamerscore (points from completed achievements)
  const totalGamerscore = React.useMemo(() => {
    return achievements
      .filter(a => a.completed && a.achievement?.points)
      .reduce((sum, a) => sum + (a.achievement.points || 0), 0);
  }, [achievements]);

  if (achievements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-[#101010] rounded-lg">
        <Trophy className="h-12 w-12 mb-4 text-gray-300" />
        <p>No achievements available</p>
      </div>
    );
  }

  // Count completed achievements
  const completedCount = achievements.filter(a => a.completed).length;
  const totalCount = achievements.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-8 bg-[#101010] p-4 rounded-lg">
      {/* Xbox-style achievement summary */}
      <div className="bg-[#0f0f0f] border border-[#282828] rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Trophy className="h-8 w-8 text-[#107C10] mr-3" />
            <h2 className="text-2xl font-bold text-white">Achievement Summary</h2>
          </div>
          <div className="text-white bg-[#282828] px-3 py-1 rounded-md flex items-center">
            <span className="text-[#107C10] font-bold mr-2">G</span>
            <span className="font-bold">{totalGamerscore}</span>
          </div>
        </div>
        
        <div className="flex justify-between mb-2">
          <span className="text-gray-400">Completed</span>
          <span className="text-white font-bold">{completedCount} / {totalCount}</span>
        </div>
        
        <div className="h-2 bg-[#282828] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#107C10]"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <div className="text-right text-sm text-gray-400 mt-1">
          {completionPercentage}% Complete
        </div>
      </div>
      
      {/* Achievement categories */}
      {categoriesToShow.map(category => {
        if (!groupedAchievements[category]?.length) return null;
        
        const CategoryIcon = ACHIEVEMENT_CATEGORIES[category as keyof typeof ACHIEVEMENT_CATEGORIES]?.icon || Award;
        const categoryTitle = ACHIEVEMENT_CATEGORIES[category as keyof typeof ACHIEVEMENT_CATEGORIES]?.title || category;
        const categoryDescription = ACHIEVEMENT_CATEGORIES[category as keyof typeof ACHIEVEMENT_CATEGORIES]?.description || '';
        
        return (
          <div key={category} className="mb-8">
            {/* Category header */}
            <div className="mb-4 border-b border-[#282828] pb-2">
              <div className="flex items-center gap-2">
                <CategoryIcon className="h-6 w-6 text-[#107C10]" />
                <h2 className="text-xl font-bold text-white">{categoryTitle}</h2>
              </div>
              <p className="text-gray-400 text-sm mt-1">{categoryDescription}</p>
            </div>
            
            {/* Achievement cards */}
            <div className="space-y-4">
              {groupedAchievements[category].map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border ${
                    achievement.completed
                      ? 'bg-[#1e1e1e] border-[#107C10]'
                      : 'bg-[#1a1a1a] border-[#282828]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="h-20 w-20 rounded-md overflow-hidden flex-shrink-0 bg-black flex items-center justify-center">
                      {achievement.achievement?.image ? (
                        <img
                          src={achievement.achievement.image}
                          alt={achievement.achievement.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/200/107C10/FFFFFF?text=🏆";
                          }}
                        />
                      ) : (
                        <Trophy className="h-10 w-10 text-[#107C10]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="text-white font-bold text-lg">
                          {achievement.achievement?.name}
                        </h3>
                        {achievement.achievement?.points && (
                          <div className="ml-2 bg-[#282828] px-2 py-1 rounded flex items-center">
                            <span className="text-[#107C10] font-bold mr-1 text-sm">G</span>
                            <span className="text-white text-sm font-bold">{achievement.achievement.points}</span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-gray-400 mt-1">{achievement.achievement?.description}</p>

                      {/* Achievement unlock status */}
                      {achievement.completed ? (
                        <div className="mt-2 flex items-center text-[#107C10]">
                          <Award className="h-4 w-4 mr-1" />
                          <span className="text-sm font-bold">UNLOCKED</span>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center text-gray-500">
                          <Award className="h-4 w-4 mr-1" />
                          <span className="text-sm">LOCKED</span>
                        </div>
                      )}

                      {/* Progress bar for achievements with target values */}
                      {achievement.achievement?.target_value && (
                        <div className="mt-3">
                          <div className="h-2 bg-[#282828] rounded-full overflow-hidden">
                            <div
                              className={`h-full ${achievement.completed ? 'bg-[#107C10]' : 'bg-[#5e5e5e]'}`}
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
