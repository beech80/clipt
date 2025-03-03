import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AchievementItem from './AchievementItem';
import { Trophy } from 'lucide-react';
import { achievementService } from '@/services/achievementService';

type AchievementListProps = {
  userId: string;
  gameId?: number;
};

// Specific order for achievements to match Xbox image
const achievementOrder = [
  'Complete 4 Daily Quests',
  'Earn Your Way',
  'Dead Space',
  'The Long Dark',
  'Earn an Achievement in Game Pass'
];

const AchievementList: React.FC<AchievementListProps> = ({ userId, gameId }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const categories = [
    { id: 'daily', label: 'Daily' },
    { id: 'streaming', label: 'Streaming' },
    { id: 'social', label: 'Social' },
    { id: 'gaming', label: 'Gaming' },
    { id: 'general', label: 'General' }
  ];

  // Fetch achievements based on whether this is for a game or a user
  const { data: achievements, isLoading } = useQuery({
    queryKey: gameId ? ['game-achievements', gameId] : ['user-achievements', userId],
    queryFn: async () => {
      if (gameId) {
        return await achievementService.getGameAchievements(gameId);
      } else {
        return await achievementService.getUserAchievements(userId);
      }
    },
    enabled: !!userId || !!gameId
  });

  // Filter achievements by category
  const filteredAchievements = React.useMemo(() => {
    if (!achievements) return [];
    
    // For game achievements
    if (gameId) {
      return selectedCategory ? achievements.filter(a => a.category === selectedCategory) : achievements;
    }
    
    // For user achievements
    return selectedCategory
      ? achievements.filter(a => a.achievement.category === selectedCategory)
      : achievements;
  }, [achievements, selectedCategory, gameId]);

  // Sort achievements according to the specific order
  const sortedAchievements = React.useMemo(() => {
    if (!filteredAchievements.length) return [];
    
    return [...filteredAchievements].sort((a, b) => {
      const nameA = gameId ? a.name : a.achievement.name;
      const nameB = gameId ? b.name : b.achievement.name;
      
      const indexA = achievementOrder.findIndex(name => name === nameA);
      const indexB = achievementOrder.findIndex(name => name === nameB);
      
      // If both are in the order array, sort by their positions
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      // If only one is in the order array, prioritize it
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      // Otherwise, sort by name
      return nameA.localeCompare(nameB);
    });
  }, [filteredAchievements, gameId]);

  if (isLoading) {
    return <div className="p-4 text-center">Loading achievements...</div>;
  }

  // Show demo achievements to match Xbox style
  const mockShowXboxAchievements = true;
  if (mockShowXboxAchievements) {
    return (
      <div className="space-y-4">
        <div className="flex w-full overflow-hidden">
          <AchievementItem 
            achievement={{
              name: 'Complete 4 Daily Quests',
              description: 'Complete 4 daily quests this week',
              target_value: 4,
              points: 10,
              category: 'daily',
              progress_type: 'count',
              reward_type: 'points'
            }}
            progress={{
              achievementId: '1',
              userId: '1',
              currentValue: 2,
              completed: false,
              achievement: {
                name: 'Complete 4 Daily Quests',
                description: 'Complete 4 daily quests this week',
                target_value: 4,
                points: 10,
                category: 'daily',
                progress_type: 'count',
                reward_type: 'points'
              }
            }}
          />
        </div>

        <div className="flex w-full overflow-hidden">
          <AchievementItem 
            achievement={{
              name: 'Earn Your Way',
              description: 'Unlock 3 achievements or play 3 different Game Pass games',
              target_value: 3,
              points: 10,
              category: 'daily',
              progress_type: 'count',
              reward_type: 'points'
            }}
            progress={{
              achievementId: '2',
              userId: '1',
              currentValue: 1,
              completed: false,
              achievement: {
                name: 'Earn Your Way',
                description: 'Unlock 3 achievements or play 3 different Game Pass games',
                target_value: 3,
                points: 10,
                category: 'daily',
                progress_type: 'count',
                reward_type: 'points'
              }
            }}
          />
        </div>

        <div className="flex w-full overflow-hidden">
          <AchievementItem 
            achievement={{
              name: 'Dead Space',
              description: 'Play',
              target_value: 1,
              points: 25,
              category: 'gaming',
              progress_type: 'count',
              reward_type: 'points'
            }}
            progress={{
              achievementId: '3',
              userId: '1',
              currentValue: 0,
              completed: false,
              achievement: {
                name: 'Dead Space',
                description: 'Play',
                target_value: 1,
                points: 25,
                category: 'gaming',
                progress_type: 'count',
                reward_type: 'points'
              }
            }}
          />
        </div>

        <div className="flex w-full overflow-hidden">
          <AchievementItem 
            achievement={{
              name: 'The Long Dark',
              description: 'Have 2 Distance Travelled',
              target_value: 2,
              points: 50,
              category: 'gaming',
              progress_type: 'count',
              reward_type: 'points'
            }}
            progress={{
              achievementId: '4',
              userId: '1',
              currentValue: 0,
              completed: false,
              achievement: {
                name: 'The Long Dark',
                description: 'Have 2 Distance Travelled',
                target_value: 2,
                points: 50,
                category: 'gaming',
                progress_type: 'count',
                reward_type: 'points'
              }
            }}
          />
        </div>

        <div className="flex w-full overflow-hidden">
          <AchievementItem 
            achievement={{
              name: 'Earn an Achievement in Game Pass',
              description: 'Earn an achievement in any Game Pass game',
              target_value: 1,
              points: 10,
              category: 'gaming',
              progress_type: 'count',
              reward_type: 'points'
            }}
            progress={{
              achievementId: '5',
              userId: '1',
              currentValue: 0,
              completed: false,
              achievement: {
                name: 'Earn an Achievement in Game Pass',
                description: 'Earn an achievement in any Game Pass game',
                target_value: 1,
                points: 10,
                category: 'gaming',
                progress_type: 'count',
                reward_type: 'points'
              }
            }}
          />
        </div>
      </div>
    );
  }

  // Original achievement display logic below
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

      {/* Achievements List */}
      <div className="space-y-3">
        {gameId
          ? sortedAchievements.map((achievement, index) => (
              <AchievementItem key={index} gameAchievement={achievement} />
            ))
          : sortedAchievements.map((achievementProgress, index) => (
              <AchievementItem
                key={index}
                progress={achievementProgress}
                achievement={achievementProgress.achievement}
              />
            ))}
      </div>
    </div>
  );
};

export default AchievementList;
