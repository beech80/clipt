import React from 'react';
import { Trophy, Users, Star, Monitor, Circle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { Achievement, AchievementProgress, GameAchievement } from '@/types/profile';

interface AchievementItemProps {
  progress?: AchievementProgress;
  achievement?: Achievement;
  gameAchievement?: GameAchievement;
}

export const AchievementItem: React.FC<AchievementItemProps> = ({ 
  progress, 
  achievement,
  gameAchievement
}) => {
  // Handle either regular achievement or game achievement
  const isGameAchievement = !!gameAchievement;
  
  const name = isGameAchievement ? gameAchievement.name : achievement?.name;
  const description = isGameAchievement ? gameAchievement.description : achievement?.description;
  const points = isGameAchievement ? gameAchievement.points : achievement?.points;
  const targetValue = isGameAchievement ? gameAchievement.target_value : achievement?.target_value;
  const currentValue = isGameAchievement ? gameAchievement.progress : progress?.current_value || 0;
  const completed = isGameAchievement ? gameAchievement.completed : progress?.completed;
  const category = isGameAchievement ? 'gaming' : achievement?.category;
  
  const progressPercent = Math.min(
    100, 
    currentValue > 0 && targetValue > 0
      ? (currentValue / targetValue) * 100 
      : 0
  );
  
  const getAchievementIcon = (category: string) => {
    switch (category) {
      case 'streaming':
        return <Star className="w-8 h-8 text-purple-400" />;
      case 'social':
        return <Users className="w-8 h-8 text-blue-400" />;
      case 'gaming':
        return <Monitor className="w-8 h-8 text-green-400" />;
      default:
        return <Trophy className="w-8 h-8 text-amber-400" />;
    }
  };
  
  const getRarityBadge = () => {
    if (!isGameAchievement || !gameAchievement.rarity) return null;
    
    const rarityColors = {
      common: 'bg-gray-500/20 text-gray-400',
      uncommon: 'bg-green-500/20 text-green-400',
      rare: 'bg-blue-500/20 text-blue-400',
      epic: 'bg-purple-500/20 text-purple-400',
      legendary: 'bg-amber-500/20 text-amber-400'
    };
    
    return (
      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mr-2 ${rarityColors[gameAchievement.rarity]}`}>
        {gameAchievement.rarity.charAt(0).toUpperCase() + gameAchievement.rarity.slice(1)}
      </span>
    );
  };

  return (
    <div className="flex w-full bg-gray-800/60 rounded-lg p-4 mb-2 relative">
      {/* Left Section - Icon */}
      <div className="flex-shrink-0 mr-4">
        <div className="w-14 h-14 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center">
          {getAchievementIcon(category)}
        </div>
      </div>
      
      {/* Main Content Section */}
      <div className="flex-1">
        {/* Top Row - Name and Points */}
        <div className="flex justify-between items-start mb-1">
          <div>
            <h3 className="text-lg font-bold text-white">
              {name}
            </h3>
            <p className="text-sm text-gray-400 mb-2">
              {description}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-green-400 font-bold">+{points} pts</span>
            {isGameAchievement && (
              <span className="text-xs text-gray-500">
                {gameAchievement.completed_players} / {gameAchievement.total_players} players
              </span>
            )}
          </div>
        </div>
        
        {/* Progress Section */}
        <div className="space-y-1 mt-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Progress</span>
            <span className="text-gray-400 font-mono">
              {currentValue} / {targetValue}
            </span>
          </div>
          <div className="relative pt-1">
            <div className="flex mb-1 items-center justify-between">
              <div className="w-full bg-gray-900 rounded-full h-2.5">
                <div className={`h-2.5 rounded-full ${completed ? 'bg-green-500' : 'bg-blue-600'}`} 
                  style={{ width: `${progressPercent}%` }}>
                </div>
              </div>
            </div>
            <div className="flex text-xs items-center justify-between">
              <div>
                {getRarityBadge()}
                <span className={`
                  inline-block px-2 py-1 rounded-full text-xs font-medium
                  ${category === 'streaming' ? 'bg-purple-500/20 text-purple-400' :
                    category === 'social' ? 'bg-blue-500/20 text-blue-400' :
                    category === 'gaming' ? 'bg-green-500/20 text-green-400' :
                    'bg-amber-500/20 text-amber-400'}
                `}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </span>
              </div>
              <span className="text-right font-bold">{progressPercent.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Completion Badge */}
      {completed && (
        <div className="absolute top-3 right-3">
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
