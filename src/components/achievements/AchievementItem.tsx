import React from 'react';
import { Trophy, Star, Users, Monitor, Calendar, ArrowUp, MessageSquare, Heart } from 'lucide-react';
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
      <div className="relative overflow-hidden rounded-md border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="p-4 flex gap-4">
          <div className="h-16 w-16 flex-shrink-0 rounded-md bg-gradient-to-b from-purple-500/20 to-blue-500/20 flex items-center justify-center relative">
            {getAchievementIcon(gameAchievement.category)}
            <div className="absolute top-0 right-0 bg-yellow-500 text-xs text-black font-bold px-1 rounded">
              +{gameAchievement.points}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold">{gameAchievement.name}</h3>
            <p className="text-gray-400 text-sm line-clamp-2">{gameAchievement.description}</p>
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">
                  {gameAchievement.currentValue} / {gameAchievement.targetValue}
                </span>
                <span className={cn("font-semibold", gameAchievement.completed ? "text-green-400" : "text-blue-400")}>
                  {percentComplete}%
                </span>
              </div>
              <Progress 
                value={percentComplete} 
                className="h-2 bg-gray-700" 
                indicatorClassName={gameAchievement.completed ? "bg-green-500" : "bg-blue-500"} 
              />
            </div>
          </div>
        </div>
        {gameAchievement.completed && (
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 pointer-events-none flex items-center justify-center">
            <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
              Completed
            </div>
          </div>
        )}
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

  return (
    <div className="relative overflow-hidden rounded-lg border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="p-4 flex gap-4">
        <div className="h-16 w-16 flex-shrink-0 rounded-md bg-gradient-to-b from-purple-500/20 to-blue-500/20 flex items-center justify-center relative">
          {getAchievementIcon(achievement.category)}
          <div className="absolute top-0 right-0 bg-yellow-500 text-xs text-black font-bold px-1 rounded">
            +{achievement.points}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold">{achievement.name}</h3>
          <p className="text-gray-400 text-sm line-clamp-2">{achievement.description}</p>
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">
                {progress.currentValue} / {achievement.target_value}
              </span>
              <span 
                className={cn(
                  "font-semibold", 
                  isCompleted ? "text-green-400" : "text-blue-400"
                )}
              >
                {percentComplete}%
              </span>
            </div>
            <Progress 
              value={percentComplete} 
              className="h-2 bg-gray-700" 
              indicatorClassName={isCompleted ? "bg-green-500" : "bg-blue-500"} 
            />
          </div>
        </div>
      </div>
      {isCompleted && (
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 pointer-events-none flex items-center justify-center">
          <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
            Completed
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get the appropriate icon based on category
const getAchievementIcon = (category: string) => {
  switch (category) {
    case 'streaming':
      return <Star className="w-8 h-8 text-purple-400" />;
    case 'social':
      return <Users className="w-8 h-8 text-blue-400" />;
    case 'gaming':
      return <Monitor className="w-8 h-8 text-green-400" />;
    case 'daily':
      return <Calendar className="w-8 h-8 text-amber-400" />;
    case 'trophy':
      return <Trophy className="w-8 h-8 text-yellow-400" />;
    case 'comment':
      return <MessageSquare className="w-8 h-8 text-indigo-400" />;
    case 'follower':
      return <Users className="w-8 h-8 text-blue-400" />;
    case 'weekly':
      return <ArrowUp className="w-8 h-8 text-red-400" />;
    default:
      return <Trophy className="w-8 h-8 text-amber-400" />;
  }
};

export default AchievementItem;
