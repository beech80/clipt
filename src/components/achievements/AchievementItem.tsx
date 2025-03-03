import React from 'react';
import { Trophy, Users, Star, Monitor, Circle, Gamepad, Video, Calendar, MessageSquare, Heart, ThumbsUp, Rocket, Award, Camera, BarChart, Gift } from 'lucide-react';
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
        return <Video className="w-8 h-8 text-purple-400" />;
      case 'social':
        return <Users className="w-8 h-8 text-blue-400" />;
      case 'gaming':
        return <Gamepad className="w-8 h-8 text-green-400" />;
      case 'daily':
        return <Calendar className="w-8 h-8 text-cyan-400" />;
      default:
        return <Trophy className="w-8 h-8 text-amber-400" />;
    }
  };
  
  const getIconByName = (name: string) => {
    if (name.includes('Stream') || name.includes('Clip') || name.includes('Video')) 
      return <Video className="w-8 h-8 text-purple-400" />;
    if (name.includes('Follow') || name.includes('Friend') || name.includes('Social')) 
      return <Users className="w-8 h-8 text-blue-400" />;
    if (name.includes('Like') || name.includes('Love')) 
      return <Heart className="w-8 h-8 text-red-400" />;
    if (name.includes('Comment')) 
      return <MessageSquare className="w-8 h-8 text-emerald-400" />;
    if (name.includes('Game') || name.includes('Play')) 
      return <Gamepad className="w-8 h-8 text-green-400" />;
    if (name.includes('Daily') || name.includes('Week')) 
      return <Calendar className="w-8 h-8 text-cyan-400" />;
    if (name.includes('Master') || name.includes('Pro') || name.includes('Legend')) 
      return <Award className="w-8 h-8 text-amber-400" />;
    
    return <Trophy className="w-8 h-8 text-amber-400" />;
  };

  // Xbox Game Pass style design
  return (
    <div className={`flex w-full rounded-md mb-3 overflow-hidden ${completed ? 'border-l-4 border-green-500' : ''}`} style={{ background: 'linear-gradient(to right, rgba(30,30,30,0.9), rgba(40,40,40,0.8))' }}>
      {/* Left icon section */}
      <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.8), rgba(30,30,30,0.6))' }}>
        <div className="relative">
          {getIconByName(name || "")}
          {points && (
            <div className="absolute -top-3 -right-3 text-sm font-bold text-white">
              <span className="text-cyan-400">+{points}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Main content section */}
      <div className="flex-1 p-3">
        <div className="flex flex-col justify-between h-full">
          <div>
            <h3 className="text-md font-bold text-white mb-1">{name}</h3>
            <p className="text-sm text-gray-300 mb-2">{description}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs items-center mb-1">
              <span className="text-gray-400">
                {currentValue}/{targetValue}
              </span>
              <span className="text-white font-semibold">{Math.round(progressPercent)}%</span>
            </div>
            <Progress 
              value={progressPercent} 
              className="h-2 bg-gray-700" 
              indicatorClassName={completed ? "bg-green-500" : "bg-cyan-500"} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementItem;
