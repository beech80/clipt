import React from 'react';
import { Trophy, Star, Users, Monitor, Calendar, ArrowUp, MessageSquare, Heart, Rocket, Shield } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { Achievement, AchievementProgress, GameAchievement } from '@/types/profile';

type AchievementItemProps = {
  achievement?: Achievement;
  progress?: AchievementProgress;
  gameAchievement?: GameAchievement;
};

const AchievementItem: React.FC<AchievementItemProps> = ({
  achievement,
  progress,
  gameAchievement,
}) => {
  // If this is a game achievement, use its properties
  if (gameAchievement) {
    const percentComplete = Math.min(
      100,
      Math.round((gameAchievement.currentValue / gameAchievement.targetValue) * 100)
    );

    return (
      <div className={`flex w-full overflow-hidden mb-3 ${percentComplete > 0 ? 'border-l-4 border-green-500' : ''}`}>
        <div className="h-24 w-24 flex-shrink-0 relative">
          <div className="absolute inset-0 bg-[#012e14]">
            <div className="w-full h-full flex items-center justify-center">
              {getAchievementIcon(gameAchievement.name)}
            </div>
          </div>
          <div className="absolute top-1 left-1 text-[#34dfeb] font-bold text-lg">
            +{gameAchievement.points}
          </div>
        </div>
        <div className="flex-1 p-3 bg-[#222222]">
          <h3 className="text-white font-semibold text-lg">{gameAchievement.name}</h3>
          <p className="text-gray-400 text-sm mb-2">{gameAchievement.description} - {gameAchievement.currentValue}/{gameAchievement.targetValue}</p>
          <div className="flex justify-between text-sm mb-1">
            <div>
              <Progress 
                value={percentComplete} 
                className="h-2 w-[200px] bg-gray-700" 
                indicatorClassName="bg-[#0078d7]" 
              />
            </div>
            <span className="text-white font-medium">{percentComplete}%</span>
          </div>
        </div>
      </div>
    );
  }

  // For regular user achievements
  if (!achievement || !progress) return null;

  const percentComplete = Math.min(
    100,
    Math.round((progress.currentValue / achievement.target_value) * 100)
  );

  const isCompleted = progress.completed || percentComplete >= 100;
  const isInProgress = percentComplete > 0 && percentComplete < 100;

  // Get the current/total display
  const progressDisplay = `${progress.currentValue}/${achievement.target_value}`;

  // Check if achievement is the Earn Your Way achievement
  const isEarnYourWay = achievement.name === 'Earn Your Way';

  return (
    <div className={`flex w-full overflow-hidden mb-3 ${isEarnYourWay ? 'border border-green-500 rounded-sm' : ''}`}>
      <div className="h-24 w-24 flex-shrink-0 relative">
        <div className="absolute inset-0 bg-[#012e14]">
          <div className="w-full h-full flex items-center justify-center">
            {getAchievementIcon(achievement.name)}
          </div>
        </div>
        <div className="absolute top-1 left-1 text-[#34dfeb] font-bold text-lg">
          +{achievement.points}
        </div>
      </div>
      <div className="flex-1 p-3 bg-[#222222]">
        <h3 className="text-white font-semibold text-lg">{achievement.name}</h3>
        <p className="text-gray-400 text-sm mb-2">
          {achievement.name === 'Complete 4 Daily Quests' ? 'Complete 4 daily quests this week' : achievement.description} - {progressDisplay}
        </p>
        <div className="flex justify-between text-sm mb-1">
          <div>
            <Progress 
              value={percentComplete} 
              className="h-2 w-[200px] bg-gray-700" 
              indicatorClassName="bg-[#0078d7]" 
            />
          </div>
          <span className="text-white font-medium">{percentComplete}%</span>
        </div>
      </div>
    </div>
  );
};

// Helper function to get specific icons for achievements that match the Xbox style
const getAchievementIcon = (name: string) => {
  if (name.includes('Complete 4 Daily')) {
    return <Rocket className="w-12 h-12 text-[#42ff77]" />;
  }
  if (name.includes('Earn Your Way')) {
    return <Shield className="w-12 h-12 text-[#42ff77]" />;
  }
  if (name.includes('Trophy Collector')) {
    return <Trophy className="w-12 h-12 text-amber-400" />;
  }
  if (name.includes('Growing Community')) {
    return <Users className="w-12 h-12 text-blue-400" />;
  }
  if (name.includes('Content Creator')) {
    return <Star className="w-12 h-12 text-purple-400" />;
  }
  if (name.includes('Weekly Top')) {
    return <ArrowUp className="w-12 h-12 text-[#42ff77]" />;
  }
  if (name.includes('Follower')) {
    return <Users className="w-12 h-12 text-blue-400" />;
  }
  if (name.includes('Comment')) {
    return <MessageSquare className="w-12 h-12 text-green-400" />;
  }
  if (name.includes('Viral Hit')) {
    return <Heart className="w-12 h-12 text-red-400" />;
  }
  
  // For other achievements, use the category-based icons
  return <Trophy className="w-12 h-12 text-[#42ff77]" />;
};

export default AchievementItem;
