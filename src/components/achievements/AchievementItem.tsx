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
      <div className={`flex w-full overflow-hidden ${percentComplete > 0 ? 'border-l-4 border-green-500' : ''}`}>
        <div className="h-24 w-24 flex-shrink-0 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0d3320] to-[#083015]">
            <div className="w-full h-full flex items-center justify-center">
              {getIconForAchievement(gameAchievement.name)}
            </div>
          </div>
          <div className="absolute top-1 left-1 text-cyan-400 font-bold text-lg">
            +{gameAchievement.points}
          </div>
        </div>
        <div className="flex-1 p-3 bg-gradient-to-r from-gray-900 to-gray-800">
          <h3 className="text-white font-semibold text-lg">{gameAchievement.name}</h3>
          <p className="text-gray-400 text-sm mb-2">{gameAchievement.description}</p>
          <div className="flex justify-between text-sm mb-1">
            <div>
              <Progress 
                value={percentComplete} 
                className="h-2 w-[200px] bg-gray-700" 
                indicatorClassName="bg-blue-500" 
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

  // Check if achievement has specific style
  const isHighlighted = isInProgress && achievement.name === 'Earn Your Way';

  return (
    <div className={`flex w-full overflow-hidden mb-3 ${isHighlighted ? 'border border-green-500' : ''}`}>
      <div className="h-24 w-24 flex-shrink-0 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d3320] to-[#083015]">
          <div className="w-full h-full flex items-center justify-center">
            {getIconForAchievement(achievement.name)}
          </div>
        </div>
        <div className="absolute top-1 left-1 text-cyan-400 font-bold text-lg">
          +{achievement.points}
        </div>
      </div>
      <div className="flex-1 p-3 bg-gradient-to-r from-gray-900 to-gray-800">
        <h3 className="text-white font-semibold text-lg">{achievement.name}</h3>
        <p className="text-gray-400 text-sm mb-2">
          {achievement.description} - {progressDisplay}
        </p>
        <div className="flex justify-between text-sm mb-1">
          <div>
            <Progress 
              value={percentComplete} 
              className="h-2 w-[200px] bg-gray-700" 
              indicatorClassName="bg-blue-500" 
            />
          </div>
          <span className="text-white font-medium">{percentComplete}%</span>
        </div>
      </div>
    </div>
  );
};

// Helper function to get specific icons for achievements that match the Xbox style
const getIconForAchievement = (name: string) => {
  if (name.includes('Complete 4 Daily')) {
    return <Rocket className="w-12 h-12 text-green-500" />;
  }
  if (name.includes('Earn Your Way')) {
    return <Shield className="w-12 h-12 text-green-500" />;
  }
  if (name.includes('Dead Space')) {
    // Since we don't have real images, use a themed icon
    return <Monitor className="w-12 h-12 text-red-500" />;
  }
  if (name.includes('Long Dark')) {
    // Since we don't have real images, use a themed icon
    return <Calendar className="w-12 h-12 text-blue-400" />;
  }
  if (name.includes('Game Pass')) {
    return <Trophy className="w-12 h-12 text-green-500" />;
  }
  
  // For other achievements, use the category-based icons
  return <Trophy className="w-12 h-12 text-green-500" />;
};

export default AchievementItem;
