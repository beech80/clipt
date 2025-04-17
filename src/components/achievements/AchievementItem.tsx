import React from 'react';
import { Card } from '@/components/ui/card';
import { Trophy, Lock, Star, Users, Monitor, Calendar, ArrowUp, MessageSquare, Heart, Rocket, Shield, Award, Share, Zap, Crown, Medal, Gift, Sparkle, Gem } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { Achievement, AchievementProgress, GameAchievement } from '@/types/profile';

interface AchievementItemProps {
  achievement?: Achievement;
  progress?: AchievementProgress;
  gameAchievement?: GameAchievement;
  showDetails?: boolean;
}

const AchievementItem: React.FC<AchievementItemProps> = ({ 
  achievement, 
  progress, 
  gameAchievement, 
  showDetails = false 
}) => {
  if (gameAchievement) {
    const { 
      name, 
      description, 
      points, 
      targetValue, 
      category 
    } = gameAchievement;
    
    const progressPercentage = Math.min(Math.max((0 / targetValue) * 100, 0), 100);
    const progressText = `0% (0/${targetValue})`;
    
    return (
      <Card className={`gaming-card p-4 flex flex-col gap-4 border-gray-700/30`}>
        <div className="flex gap-4">
          {/* Achievement Icon */}
          <div className="relative">
            <div className={`w-16 h-16 rounded-md flex items-center justify-center bg-gray-800/50`}>
              {getAchievementIcon(name, category)}
              <div className="absolute inset-0 bg-black/60 rounded-md flex items-center justify-center">
                <Lock className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          </div>
          
          {/* Achievement Details */}
          <div className="flex-1">
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-bold text-gray-300">{name}</h3>
              <div className="bg-gray-800 px-2 py-1 rounded text-xs text-gray-300">{points} XP</div>
            </div>
            
            <p className="text-sm text-gray-400 mb-2">{description}</p>
            
            {/* Progress Bar */}
            <div className="space-y-1">
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex justify-between text-xs text-gray-400">
                <span>{progressText}</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
            </div>
          </div>
        </div>
        
        {showDetails && (
          <div className="mt-2 pt-3 border-t border-gray-700/30">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800/30 p-2 rounded">
                <div className="text-xs text-gray-400 mb-1">Required Skill</div>
                <div className="text-sm text-gray-200">{getSkillForAchievement(name)}</div>
              </div>
              <div className="bg-gray-800/30 p-2 rounded">
                <div className="text-xs text-gray-400 mb-1">Difficulty</div>
                <div className="text-sm text-gray-200">{getDifficultyForAchievement(name)}</div>
              </div>
            </div>
            <div className="mt-3 bg-gray-800/30 p-2 rounded">
              <div className="text-xs text-gray-400 mb-1">How to unlock</div>
              <div className="text-sm text-gray-200">{description}</div>
            </div>
          </div>
        )}
      </Card>
    );
  }

  if (!achievement || !progress) return null;
  
  const { 
    name, 
    description, 
    points, 
    target_value, 
    category 
  } = achievement;
  
  const currentValue = progress.currentValue || 0;
  const progressPercentage = Math.min(Math.max((currentValue / target_value) * 100, 0), 100);
  const progressText = currentValue >= target_value 
    ? 'Completed' 
    : `${Math.round(progressPercentage)}% (${currentValue}/${target_value})`;
  
  return (
    <Card className={`gaming-card p-4 flex flex-col gap-4 ${currentValue >= target_value ? 'border-yellow-500/30' : 'border-gray-700/30'}`}>
      <div className="flex gap-4">
        {/* Achievement Icon */}
        <div className="relative">
          <div className={`w-16 h-16 rounded-md flex items-center justify-center ${currentValue >= target_value ? 'bg-yellow-900/20' : 'bg-gray-800/50'}`}>
            {getAchievementIcon(name, category)}
            {currentValue < target_value && (
              <div className="absolute inset-0 bg-black/60 rounded-md flex items-center justify-center">
                <Lock className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>
        </div>
        
        {/* Achievement Details */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-1">
            <h3 className={`font-bold ${currentValue >= target_value ? 'text-yellow-300' : 'text-gray-300'}`}>{name}</h3>
            <div className={`${currentValue >= target_value ? 'bg-yellow-900/30 text-yellow-300' : 'bg-gray-800 text-gray-300'} px-2 py-1 rounded text-xs`}>{points} XP</div>
          </div>
          
          <p className="text-sm text-gray-400 mb-2">{description}</p>
          
          {/* Progress Bar */}
          <div className="space-y-1">
            <Progress value={progressPercentage} className={cn("h-2", currentValue >= target_value ? "bg-yellow-950" : "")} />
            <div className="flex justify-between text-xs text-gray-400">
              <span>{progressText}</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Always show trophy details section */}
      <div className="mt-2 pt-3 border-t border-gray-700/30">
        {/* Skill and Difficulty row - always visible */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800/30 p-2 rounded">
            <div className="text-xs text-gray-400 mb-1">Trophy Type</div>
            <div className="text-sm text-gray-200">{getSkillForAchievement(name)}</div>
          </div>
          <div className="bg-gray-800/30 p-2 rounded">
            <div className="text-xs text-gray-400 mb-1">Difficulty</div>
            <div className="text-sm text-gray-200">{getDifficultyForAchievement(name)}</div>
          </div>
        </div>
        
        {/* How to unlock - always visible */}
        <div className="mt-3 bg-gray-800/30 p-2 rounded">
          <div className="text-xs text-gray-400 mb-1">How to earn this trophy</div>
          <div className="text-sm text-gray-200">{description}</div>
        </div>
        
        {/* Additional details only shown when showDetails is true */}
        {showDetails && (
          <div className="mt-3 bg-gray-800/30 p-2 rounded">
            <div className="text-xs text-gray-400 mb-1">Reward</div>
            <div className="text-sm text-gray-200">
              {category === 'trophy' ? 'Exclusive Trophy Badge' : `${points} XP Points`}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

// Helper function to get the appropriate icon based on achievement name or category
const getAchievementIcon = (name: string, category?: string) => {
  const iconClassName = "w-8 h-8 text-gray-500";
  
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

// Helper function to get the skill associated with each achievement
const getSkillForAchievement = (name: string): string => {
  const skillMap: {[key: string]: string} = {
    // Content creation skills
    'First Taste of Gold': 'Content Creation',
    'Crowd Favorite': 'Content Creation',
    'Viral Sensation': 'Content Creation',
    'Content King': 'Content Creation',
    'Clipt Icon': 'Content Creation',
    
    // Streaming skills
    'First Supporter': 'Streaming',
    'Small but Mighty': 'Streaming',
    'Streaming Star': 'Streaming',
    'Big League Streamer': 'Streaming',
    'Streaming Legend': 'Streaming',
    
    // Community skills
    'First Follower': 'Community Building',
    'Rising Star': 'Community Building',
    'Trending Now': 'Community Building',
    'Influencer Status': 'Community Building',
    'Clipt Famous': 'Community Building',
    'Elite Creator': 'Community Building',
    
    // Engagement skills
    'Hype Squad': 'Engagement',
    'Super Supporter': 'Engagement',
    'Engagement Master': 'Engagement',
    'Conversation Starter': 'Engagement',
    'Community Builder': 'Engagement',
    
    // Leaderboard skills
    'Breaking In': 'Consistency',
    'Back-to-Back': 'Consistency',
    'Hot Streak': 'Consistency',
    'Unstoppable': 'Consistency',
    'Clipt Hall of Fame': 'Consistency',
    
    // Default
    'default': 'General Skills'
  };
  
  return skillMap[name] || skillMap['default'];
};

// Helper function to get the difficulty level for each achievement
const getDifficultyForAchievement = (name: string): string => {
  const difficultyMap: {[key: string]: string} = {
    // Easy achievements
    'First Taste of Gold': 'Easy',
    'First Follower': 'Easy',
    'First Supporter': 'Easy',
    'Breaking In': 'Easy',
    'Hype Squad': 'Easy',
    'Complete 4 Daily Quests': 'Easy',
    'Earn Your Way': 'Easy',
    
    // Medium achievements
    'Crowd Favorite': 'Medium',
    'Rising Star': 'Medium',
    'Small but Mighty': 'Medium',
    'Back-to-Back': 'Medium',
    'Super Supporter': 'Medium',
    'Trending Now': 'Medium',
    
    // Hard achievements
    'Viral Sensation': 'Hard',
    'Influencer Status': 'Hard',
    'Streaming Star': 'Hard',
    'Hot Streak': 'Hard',
    'Engagement Master': 'Hard',
    
    // Very Hard achievements
    'Content King': 'Very Hard',
    'Clipt Famous': 'Very Hard',
    'Big League Streamer': 'Very Hard',
    'Unstoppable': 'Very Hard',
    'Community Builder': 'Very Hard',
    
    // Legendary achievements
    'Clipt Icon': 'Legendary',
    'Elite Creator': 'Legendary',
    'Streaming Legend': 'Legendary',
    'Clipt Hall of Fame': 'Legendary',
    
    // Default
    'default': 'Medium'
  };
  
  return difficultyMap[name] || difficultyMap['default'];
};

export default AchievementItem;
