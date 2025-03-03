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

  // Calculate progress percentage
  const percentComplete = Math.min(
    100,
    Math.round((progress.currentValue / achievement.target_value) * 100)
  );

  return (
    <div className={`flex w-full overflow-hidden mb-3 ${progress.completed ? 'border-l-4 border-green-500' : ''}`}>
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
        <p className="text-gray-400 text-sm mb-2">{achievement.description} - {progress.currentValue}/{achievement.target_value}</p>
        <div className="flex justify-between text-sm mb-1">
          <div>
            <Progress 
              value={percentComplete} 
              className="h-2 w-[200px] bg-gray-700" 
              indicatorClassName={cn("bg-[#0078d7]", {
                "bg-green-500": progress.completed
              })}
            />
          </div>
          <span className="text-white font-medium">{percentComplete}%</span>
        </div>
      </div>
    </div>
  );
};

// Helper function to get the appropriate icon based on achievement name
const getAchievementIcon = (name: string) => {
  const iconClassName = "h-12 w-12 text-[#01e6c9]";
  
  if (name.includes('Trophy') || name.includes('trophy')) {
    return <Trophy className={iconClassName} />;
  } else if (name.includes('Daily') || name.includes('daily')) {
    return <Calendar className={iconClassName} />;
  } else if (name.includes('Follower') || name.includes('Community')) {
    return <Users className={iconClassName} />;
  } else if (name.includes('Creator') || name.includes('Stream')) {
    return <Monitor className={iconClassName} />;
  } else if (name.includes('Comment')) {
    return <MessageSquare className={iconClassName} />;
  } else if (name.includes('Like') || name.includes('love')) {
    return <Heart className={iconClassName} />;
  } else if (name.includes('Level') || name.includes('Rank')) {
    return <ArrowUp className={iconClassName} />;
  } else if (name.includes('First') || name.includes('Starter')) {
    return <Rocket className={iconClassName} />;
  } else {
    return <Star className={iconClassName} />;
  }
};

export default AchievementItem;
