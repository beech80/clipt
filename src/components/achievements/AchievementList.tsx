import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AchievementItem from './AchievementItem';
import { Trophy } from 'lucide-react';
import { achievementService } from '@/services/achievementService';

type AchievementListProps = {
  userId: string;
  gameId?: number;
  forceShowDemo?: boolean;
};

// Specific order for achievements to match Xbox image
const achievementOrder = [
  // Daily achievements
  'Complete 4 Daily Quests',
  'Earn Your Way',
  
  // Trophy achievements
  'First Taste of Gold',
  'Crowd Favorite',
  'Viral Sensation',
  'Content King',
  'Clipt Icon',
  
  // Weekly leaderboard achievements
  'Breaking In',
  'Back-to-Back',
  'Hot Streak',
  'Unstoppable',
  'Clipt Hall of Fame',
  
  // Follower achievements
  'First Follower',
  'Rising Star',
  'Trending Now',
  'Influencer Status',
  'Clipt Famous',
  'Elite Creator',
  
  // Streaming subscriber achievements
  'First Supporter',
  'Small but Mighty',
  'Streaming Star',
  'Big League Streamer',
  'Streaming Legend',
  
  // Engagement achievements
  'Hype Squad',
  'Super Supporter',
  'Engagement Master',
  'Conversation Starter',
  'Community Builder',
  
  // Sharing achievements
  'Signal Booster',
  'Clipt Evangelist',
  'The Connector',
  'Trendsetter',
  'Algorithm Whisperer',
  
  // Collab achievements
  'Duo Dynamic',
  'Mentor Mode',
  'The Networker',
  'Creator Spotlight',
  'Industry Connector',
  
  // Hidden/special achievements
  'OG Clipt Creator',
  'Day One Grinder',
  'Mystery Viral',
  'Shadow Supporter',
  'The Legend of Clipt'
];

const AchievementList: React.FC<AchievementListProps> = ({ userId, gameId, forceShowDemo = false }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>('trophy');
  
  const categories = [
    { id: 'trophy', label: 'Trophies' },
    { id: 'streaming', label: 'Streaming' },
    { id: 'social', label: 'Social' },
    { id: 'special', label: 'Special' },
    { id: 'daily', label: 'Daily' },
    { id: 'general', label: 'General' }
  ];

  // Fetch achievements based on whether this is for a game or a user
  const { data: achievements, isLoading, error } = useQuery({
    queryKey: gameId ? ['game-achievements', gameId] : ['user-achievements', userId],
    queryFn: async () => {
      if (gameId) {
        // Make sure gameId is a number
        const numericGameId = typeof gameId === 'string' ? parseInt(gameId, 10) : gameId;
        return await achievementService.getGameAchievements(numericGameId);
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
      // For game achievements (like the image shows)
      const nameA = gameId ? a.name : a.achievement.name;
      const nameB = gameId ? b.name : b.achievement.name;
      
      // Special handling for the exact achievements from the reference image
      // This ensures they're displayed in the same order as the image
      const specialAchievements = ['Souls Saved', 'Seeing You Sooner', 'King', 'Butter and Egg Man'];
      
      const specialIndexA = specialAchievements.indexOf(nameA);
      const specialIndexB = specialAchievements.indexOf(nameB);
      
      // If both are in the special achievements list, sort by their positions
      if (specialIndexA !== -1 && specialIndexB !== -1) {
        return specialIndexA - specialIndexB;
      }
      
      // If only one is in the special list, prioritize it
      if (specialIndexA !== -1) return -1;
      if (specialIndexB !== -1) return 1;
      
      // For regular achievements, continue with normal sorting
      const indexA = achievementOrder.indexOf(nameA);
      const indexB = achievementOrder.indexOf(nameB);
      
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

  // When forceShowDemo is true, we always want to show Xbox-style achievements regardless of loading state
  if (forceShowDemo) {
    return renderDemoAchievements();
  }

  if (isLoading) {
    return <div className="p-4 text-center">Loading achievements...</div>;
  }
  
  if (error) {
    console.error('Achievement error:', error);
    return <div className="p-4 text-center text-red-500">Error loading achievements</div>;
  }

  // Show sample Xbox-style achievements if no achievements are returned
  const showXboxStyleAchievements = !achievements || achievements.length === 0;
  
  if (showXboxStyleAchievements) {
    return renderDemoAchievements();
  }

  // Function to render demo Xbox-style achievements
  function renderDemoAchievements() {
    return (
      <div className="space-y-4">
        {/* Category selector buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded text-sm ${
                selectedCategory === category.id
                  ? 'bg-[#012e14] text-[#34dfeb]'
                  : 'bg-[#222222] text-gray-300 hover:bg-[#333333]'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
        
        {selectedCategory === 'trophy' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-white mb-4">
              <Trophy className="text-yellow-500" />
              Trophy Achievements
              <span className="text-sm font-normal text-gray-400 ml-2">
                (Earn these by getting clips in the weekly top 10)
              </span>
            </h3>
            
            <div className="bg-[#111122] p-3 rounded-md mb-6">
              <p className="text-gray-300 text-sm">
                Trophy achievements are special rewards earned when your clips rank in the weekly leaderboards.
                Get your content to the top 10 to unlock these exclusive achievements and show off your content creator skills!
              </p>
            </div>
            
            <div className="flex w-full overflow-hidden">
              <AchievementItem 
                achievement={{
                  id: '3',
                  name: 'First Taste of Gold',
                  description: 'Earn 10 trophies from your popular clips',
                  target_value: 10,
                  points: 25,
                  category: 'trophy',
                  progress_type: 'count',
                  reward_type: 'points'
                }}
                progress={{
                  id: '3p',
                  achievementId: '3',
                  userId: userId,
                  currentValue: 3,
                  completed: false,
                  achievement: {
                    id: '3',
                    name: 'First Taste of Gold',
                    description: 'Earn 10 trophies from your popular clips',
                    target_value: 10,
                    points: 25,
                    category: 'trophy',
                    progress_type: 'count',
                    reward_type: 'points'
                  }
                }}
              />
            </div>
            
            <div className="flex w-full overflow-hidden">
              <AchievementItem 
                achievement={{
                  id: '4',
                  name: 'Crowd Favorite',
                  description: 'Earn 50 trophies from your popular clips',
                  target_value: 50,
                  points: 50,
                  category: 'trophy',
                  progress_type: 'count',
                  reward_type: 'points'
                }}
                progress={{
                  id: '4p',
                  achievementId: '4',
                  userId: userId,
                  currentValue: 15,
                  completed: false,
                  achievement: {
                    id: '4',
                    name: 'Crowd Favorite',
                    description: 'Earn 50 trophies from your popular clips',
                    target_value: 50,
                    points: 50,
                    category: 'trophy',
                    progress_type: 'count',
                    reward_type: 'points'
                  }
                }}
              />
            </div>
            
            <div className="flex w-full overflow-hidden">
              <AchievementItem 
                achievement={{
                  id: '5',
                  name: 'Viral Sensation',
                  description: 'Earn 100 trophies from your popular clips',
                  target_value: 100,
                  points: 100,
                  category: 'trophy',
                  progress_type: 'count',
                  reward_type: 'points'
                }}
                progress={{
                  id: '5p',
                  achievementId: '5',
                  userId: userId,
                  currentValue: 0,
                  completed: false,
                  achievement: {
                    id: '5',
                    name: 'Viral Sensation',
                    description: 'Earn 100 trophies from your popular clips',
                    target_value: 100,
                    points: 100,
                    category: 'trophy',
                    progress_type: 'count',
                    reward_type: 'points'
                  }
                }}
              />
            </div>
            
            <div className="flex w-full overflow-hidden">
              <AchievementItem 
                achievement={{
                  id: '6',
                  name: 'Breaking In',
                  description: 'Have a clip appear in the weekly top 10 for the first time',
                  target_value: 1,
                  points: 25,
                  category: 'trophy',
                  progress_type: 'count',
                  reward_type: 'points'
                }}
                progress={{
                  id: '6p',
                  achievementId: '6',
                  userId: userId,
                  currentValue: 1,
                  completed: true,
                  achievement: {
                    id: '6',
                    name: 'Breaking In',
                    description: 'Have a clip appear in the weekly top 10 for the first time',
                    target_value: 1,
                    points: 25,
                    category: 'trophy',
                    progress_type: 'count',
                    reward_type: 'points'
                  }
                }}
              />
            </div>
            
            <div className="flex w-full overflow-hidden">
              <AchievementItem 
                achievement={{
                  id: '7',
                  name: 'Back-to-Back',
                  description: 'Have clips appear in the weekly top 10 two weeks in a row',
                  target_value: 2,
                  points: 50,
                  category: 'trophy',
                  progress_type: 'count',
                  reward_type: 'points'
                }}
                progress={{
                  id: '7p',
                  achievementId: '7',
                  userId: userId,
                  currentValue: 0,
                  completed: false,
                  achievement: {
                    id: '7',
                    name: 'Back-to-Back',
                    description: 'Have clips appear in the weekly top 10 two weeks in a row',
                    target_value: 2,
                    points: 50,
                    category: 'trophy',
                    progress_type: 'count',
                    reward_type: 'points'
                  }
                }}
              />
            </div>
          </div>
        )}
        
        {selectedCategory === 'social' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">
              Social Achievements
            </h3>
            
            <div className="flex w-full overflow-hidden">
              <AchievementItem 
                achievement={{
                  id: '8',
                  name: 'First Follower',
                  description: 'Get your first follower',
                  target_value: 1,
                  points: 10,
                  category: 'social',
                  progress_type: 'count',
                  reward_type: 'points'
                }}
                progress={{
                  id: '8p',
                  achievementId: '8',
                  userId: userId,
                  currentValue: 0,
                  completed: false,
                  achievement: {
                    id: '8',
                    name: 'First Follower',
                    description: 'Get your first follower',
                    target_value: 1,
                    points: 10,
                    category: 'social',
                    progress_type: 'count',
                    reward_type: 'points'
                  }
                }}
              />
            </div>
            
            <div className="flex w-full overflow-hidden">
              <AchievementItem 
                achievement={{
                  id: '9',
                  name: 'Signal Booster',
                  description: 'Share 10 clips from other creators',
                  target_value: 10,
                  points: 20,
                  category: 'social',
                  progress_type: 'count',
                  reward_type: 'points'
                }}
                progress={{
                  id: '9p',
                  achievementId: '9',
                  userId: userId,
                  currentValue: 4,
                  completed: false,
                  achievement: {
                    id: '9',
                    name: 'Signal Booster',
                    description: 'Share 10 clips from other creators',
                    target_value: 10,
                    points: 20,
                    category: 'social',
                    progress_type: 'count',
                    reward_type: 'points'
                  }
                }}
              />
            </div>
          </div>
        )}
        
        {selectedCategory === 'daily' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">
              Daily Achievements
            </h3>
            
            <div className="flex w-full overflow-hidden">
              <AchievementItem 
                achievement={{
                  id: '1',
                  name: 'Complete 4 Daily Quests',
                  description: 'Complete 4 daily quests this week',
                  target_value: 4,
                  points: 10,
                  category: 'daily',
                  progress_type: 'count',
                  reward_type: 'points'
                }}
                progress={{
                  id: '1p',
                  achievementId: '1',
                  userId: userId,
                  currentValue: 2,
                  completed: false,
                  achievement: {
                    id: '1',
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
                  id: '2',
                  name: 'Earn Your Way',
                  description: 'Upload 3 clips or earn 3 trophies',
                  target_value: 3,
                  points: 10,
                  category: 'daily',
                  progress_type: 'count',
                  reward_type: 'points'
                }}
                progress={{
                  id: '2p',
                  achievementId: '2',
                  userId: userId,
                  currentValue: 1,
                  completed: false,
                  achievement: {
                    id: '2',
                    name: 'Earn Your Way',
                    description: 'Upload 3 clips or earn 3 trophies',
                    target_value: 3,
                    points: 10,
                    category: 'daily',
                    progress_type: 'count',
                    reward_type: 'points'
                  }
                }}
              />
            </div>
          </div>
        )}
        
        {selectedCategory === 'streaming' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">
              Streaming Achievements
            </h3>
            
            <div className="flex w-full overflow-hidden">
              <AchievementItem 
                achievement={{
                  id: '10',
                  name: 'First Supporter',
                  description: 'Get your first streaming subscriber',
                  target_value: 1,
                  points: 25,
                  category: 'streaming',
                  progress_type: 'count',
                  reward_type: 'points'
                }}
                progress={{
                  id: '10p',
                  achievementId: '10',
                  userId: userId,
                  currentValue: 0,
                  completed: false,
                  achievement: {
                    id: '10',
                    name: 'First Supporter',
                    description: 'Get your first streaming subscriber',
                    target_value: 1,
                    points: 25,
                    category: 'streaming',
                    progress_type: 'count',
                    reward_type: 'points'
                  }
                }}
              />
            </div>
          </div>
        )}
        
        {selectedCategory === 'special' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">
              Special Achievements
            </h3>
            
            <div className="flex w-full overflow-hidden">
              <AchievementItem 
                achievement={{
                  id: '11',
                  name: 'OG Clipt Creator',
                  description: 'You were one of the first 1000 users to join Clipt',
                  target_value: 1,
                  points: 100,
                  category: 'special',
                  progress_type: 'boolean',
                  reward_type: 'badge'
                }}
                progress={{
                  id: '11p',
                  achievementId: '11',
                  userId: userId,
                  currentValue: 1,
                  completed: true,
                  achievement: {
                    id: '11',
                    name: 'OG Clipt Creator',
                    description: 'You were one of the first 1000 users to join Clipt',
                    target_value: 1,
                    points: 100,
                    category: 'special',
                    progress_type: 'boolean',
                    reward_type: 'badge'
                  }
                }}
              />
            </div>
          </div>
        )}
        
        {selectedCategory === 'general' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">
              General Achievements
            </h3>
            
            <div className="flex w-full overflow-hidden">
              <AchievementItem 
                achievement={{
                  id: '12',
                  name: 'Duo Dynamic',
                  description: 'Collaborate with another creator on a clip',
                  target_value: 1,
                  points: 30,
                  category: 'general',
                  progress_type: 'count',
                  reward_type: 'points'
                }}
                progress={{
                  id: '12p',
                  achievementId: '12',
                  userId: userId,
                  currentValue: 0,
                  completed: false,
                  achievement: {
                    id: '12',
                    name: 'Duo Dynamic',
                    description: 'Collaborate with another creator on a clip',
                    target_value: 1,
                    points: 30,
                    category: 'general',
                    progress_type: 'count',
                    reward_type: 'points'
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Display real achievements
  return (
    <div className="space-y-4">
      {/* Category selector buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded text-sm ${
              selectedCategory === category.id
                ? 'bg-[#012e14] text-[#34dfeb]'
                : 'bg-[#222222] text-gray-300 hover:bg-[#333333]'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>
      
      {sortedAchievements.length > 0 ? (
        <div className="space-y-4">
          {selectedCategory && (
            <h3 className="text-xl font-bold text-white">
              {categories.find(c => c.id === selectedCategory)?.label || 'Achievements'}
            </h3>
          )}
          
          <div className="grid grid-cols-1 gap-4">
            {sortedAchievements.map(achievement => (
              <AchievementItem 
                key={gameId ? achievement.id : achievement.achievement_id}
                achievement={gameId ? achievement : achievement.achievement}
                progress={gameId ? null : achievement}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center p-8">
          <p className="text-gray-400">No achievements found in this category</p>
        </div>
      )}
    </div>
  );
};

export default AchievementList;
