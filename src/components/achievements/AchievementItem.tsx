import React from 'react';
import { Trophy, Star, Users, Monitor, Calendar, ArrowUp, MessageSquare, Heart, Rocket, Shield, Award, Share, Zap, Crown, Medal, Gift, Sparkle, Gem } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Achievement, AchievementProgress, GameAchievement } from '@/types/profile';
import TrophyProgressBar from './TrophyProgressBar';

type AchievementItemProps = {
  achievement?: Achievement;
  progress?: AchievementProgress;
  gameAchievement?: GameAchievement;
};

// Function to determine rarity label and color
const getRarityInfo = (percentage: number) => {
  if (percentage < 10) {
    return { label: 'Legendary', color: '#FF7700' };
  } else if (percentage < 20) {
    return { label: 'Epic', color: '#9900FF' };
  } else if (percentage < 30) {
    return { label: 'Rare', color: '#0078FF' };
  } else if (percentage < 50) {
    return { label: 'Uncommon', color: '#00B050' };
  } else {
    return { label: 'Common', color: '#CCCCCC' };
  }
};

const AchievementItem: React.FC<AchievementItemProps> = ({
  achievement,
  progress,
  gameAchievement,
}) => {
  // If this is a game achievement, use its properties
  if (gameAchievement) {
    const rarityInfo = getRarityInfo(20); // Demo value, would be from actual player stats
    
    return (
      <div className="flex w-full overflow-hidden mb-3 rounded hover:border hover:border-gray-700 transition-colors">
        <div className="h-24 w-24 flex-shrink-0 relative">
          <div className="absolute inset-0 bg-[#012e14]">
            <div className="w-full h-full flex items-center justify-center">
              {getAchievementIcon(gameAchievement.name, gameAchievement.category)}
            </div>
          </div>
          <div className="absolute top-1 left-1 text-[#34dfeb] font-bold text-lg">
            +{gameAchievement.points}
          </div>
          <div className="absolute bottom-1 left-1 text-[10px] px-1 rounded" style={{ backgroundColor: rarityInfo.color }}>
            {rarityInfo.label}
          </div>
        </div>
        <div className="flex-1 p-3 bg-[#222222]">
          <h3 className="text-white font-semibold text-lg">{gameAchievement.name}</h3>
          <p className="text-gray-400 text-sm mb-2">
            {gameAchievement.description} - 0/{gameAchievement.targetValue}
          </p>
          <div className="mb-1">
            <TrophyProgressBar 
              currentValue={0} 
              targetValue={gameAchievement.targetValue}
              isCompleted={false}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-gray-500 text-xs">Unlocked by 0% of players</span>
          </div>
        </div>
      </div>
    );
  }

  // For regular user achievements
  if (!achievement || !progress) return null;
  
  // Calculate the progress percentage correctly
  const currentValue = progress.currentValue || 0;
  const targetValue = achievement.target_value || 1;
  const percentComplete = Math.min(100, Math.round((currentValue / targetValue) * 100));
  const isCompleted = currentValue >= targetValue;
  
  // Get rarity info for user achievements
  const rarityInfo = getRarityInfo(30); // Demo value, would use real data

  return (
    <div className="flex w-full overflow-hidden mb-3 rounded hover:border hover:border-gray-700 transition-colors">
      <div className="h-24 w-24 flex-shrink-0 relative">
        <div className={`absolute inset-0 ${isCompleted ? 'bg-[#1e6b13]' : 'bg-[#012e14]'}`}>
          <div className="w-full h-full flex items-center justify-center">
            {getAchievementIcon(achievement.name, achievement.category)}
          </div>
        </div>
        <div className="absolute top-1 left-1 text-[#34dfeb] font-bold text-lg">
          +{achievement.points}
        </div>
        {isCompleted && (
          <div className="absolute bottom-1 right-1">
            <Trophy className="h-5 w-5 text-yellow-400" />
          </div>
        )}
        <div className="absolute bottom-1 left-1 text-[10px] px-1 rounded" style={{ backgroundColor: rarityInfo.color }}>
          {rarityInfo.label}
        </div>
      </div>
      <div className="flex-1 p-3 bg-[#222222]">
        <h3 className="text-white font-semibold text-lg">{achievement.name}</h3>
        <p className="text-gray-400 text-sm mb-2">
          {achievement.description} - {currentValue}/{targetValue}
        </p>
        <div className="mb-1">
          <TrophyProgressBar 
            currentValue={currentValue} 
            targetValue={targetValue} 
            isCompleted={isCompleted}
          />
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-gray-500 text-xs">
            {isCompleted 
              ? `Unlocked on ${new Date(progress.updated_at || Date.now()).toLocaleDateString()}` 
              : `${percentComplete}% Progress`
            }
          </span>
        </div>
      </div>
    </div>
  );
};

// Helper function to get the appropriate icon based on achievement name or category
const getAchievementIcon = (name: string, category?: string) => {
  const iconClassName = "h-12 w-12 text-[#01e6c9]";
  
  // First check by category if available
  if (category) {
    switch (category) {
      case 'trophy':
        return <Trophy className={iconClassName} />;
      case 'social':
        return <Users className={iconClassName} />;
      case 'streaming':
        return <Monitor className={iconClassName} />;
      case 'daily':
        return <Calendar className={iconClassName} />;
      case 'special':
        return <Sparkle className={iconClassName} />;
    }
  }
  
  // Then check by name keywords
  if (name.includes('First Taste') || name.includes('Trophy') || name.includes('Crowd Favorite') || 
      name.includes('Content King') || name.includes('Viral') || name.includes('Icon')) {
    return <Trophy className={iconClassName} />;
  } else if (name.includes('Break') || name.includes('Back-to-Back') || name.includes('Hot Streak') ||
      name.includes('Unstoppable') || name.includes('Hall of Fame')) {
    return <Crown className={iconClassName} />;
  } else if (name.includes('Follower') || name.includes('Rising Star') || name.includes('Trending') ||
      name.includes('Influencer') || name.includes('Famous') || name.includes('Elite Creator')) {
    return <Users className={iconClassName} />;
  } else if (name.includes('Stream') || name.includes('Supporter') || name.includes('Streaming') ||
      name.includes('Big League') || name.includes('Legend')) {
    return <Monitor className={iconClassName} />;
  } else if (name.includes('Engagement') || name.includes('Hype') || name.includes('Super') ||
      name.includes('Conversation') || name.includes('Community')) {
    return <MessageSquare className={iconClassName} />;
  } else if (name.includes('Signal') || name.includes('Share') || name.includes('Evangelist') ||
      name.includes('Connector') || name.includes('Algorithm')) {
    return <Share className={iconClassName} />;
  } else if (name.includes('Duo') || name.includes('Mentor') || name.includes('Networker') ||
      name.includes('Creator Spotlight') || name.includes('Industry')) {
    return <Users className={iconClassName} />;
  } else if (name.includes('OG') || name.includes('Day One') || name.includes('Mystery') ||
      name.includes('Shadow') || name.includes('Legend of Clipt')) {
    return <Gem className={iconClassName} />;
  } else if (name.includes('Daily') || name.includes('Quest')) {
    return <Calendar className={iconClassName} />;
  } else if (name.includes('Earn Your Way')) {
    return <Zap className={iconClassName} />;
  } else {
    return <Award className={iconClassName} />;
  }
};

export default AchievementItem;
