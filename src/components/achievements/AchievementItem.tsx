import React from 'react';
import { Trophy, Users, Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { Achievement, AchievementProgress } from '@/types/profile';

interface AchievementItemProps {
  progress: AchievementProgress;
  achievement: Achievement;
}

export const AchievementItem: React.FC<AchievementItemProps> = ({ 
  progress, 
  achievement 
}) => {
  const progressPercent = Math.min(
    100, 
    progress.current_value > 0 
      ? (progress.current_value / achievement.target_value) * 100 
      : 0
  );
  
  const getAchievementIcon = (category: string) => {
    switch (category) {
      case 'streaming':
        return <Star className="w-10 h-10 text-purple-400" />;
      case 'social':
        return <Users className="w-10 h-10 text-blue-400" />;
      default:
        return <Trophy className="w-10 h-10 text-amber-400" />;
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Icon and Header Row */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-gray-800/50 border border-gray-700 flex items-center justify-center">
          {getAchievementIcon(achievement.category)}
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">
            {achievement.name}
          </h3>
          <p className="text-sm text-gray-400">
            {achievement.description}
          </p>
        </div>
        
        <div className="text-right">
          <span className="text-green-400 font-bold">+{achievement.points} pts</span>
          {progress.completed && (
            <p className="text-xs text-gray-500 mt-1">
              Completed {new Date(progress.created_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
      
      {/* Progress Section */}
      <div className="space-y-2 mt-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Progress</span>
          <span className="text-gray-400">
            {progress.current_value} / {achievement.target_value}
          </span>
        </div>
        <Progress 
          value={progressPercent} 
          className="h-2 bg-gray-800"
          indicatorClassName={progress.completed 
            ? "bg-gradient-to-r from-green-500 to-emerald-400"
            : "bg-gradient-to-r from-purple-500 to-blue-400"
          }
        />
      </div>
      
      {/* Category Tag */}
      <div className="mt-3">
        <span className={`
          inline-block px-2 py-1 rounded-full text-xs font-medium
          ${achievement.category === 'streaming' ? 'bg-purple-500/20 text-purple-400' :
            achievement.category === 'social' ? 'bg-blue-500/20 text-blue-400' :
            'bg-amber-500/20 text-amber-400'}
        `}>
          {achievement.category.charAt(0).toUpperCase() + achievement.category.slice(1)}
        </span>
      </div>
      
      {/* Completion Check */}
      {progress.completed && (
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
  );
};

export default AchievementItem;
