// Achievement type definitions for the Clipt application

/**
 * Represents an achievement's rarity level
 */
export enum AchievementRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

/**
 * Represents an achievement's type/category
 */
export enum AchievementType {
  STREAMING = 'streaming',
  SOCIAL = 'social',
  GENERAL = 'general',
  GAME = 'game'
}

/**
 * Base Achievement interface
 * Defines the structure for achievements in the system
 */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon_url: string;
  type: AchievementType;
  rarity: AchievementRarity;
  points: number;
  max_progress: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface for tracking a user's progress towards an achievement
 */
export interface AchievementProgress {
  id: string;
  user_id: string;
  achievement_id: string;
  current_progress: number;
  completed: boolean;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
  achievement?: Achievement; // Optional joined achievement data
}

/**
 * Interface for game-specific achievements
 * Extends the base Achievement with game-specific properties
 */
export interface GameAchievement extends Achievement {
  game_id: string;
  game_name?: string;
  requirement_description?: string; // Additional description of how to earn
  secret?: boolean; // If true, details are hidden until unlocked
}

/**
 * Interface for a user's achievement stats
 */
export interface UserAchievementStats {
  total_achievements: number;
  completed_achievements: number;
  completion_percentage: number;
  total_points: number;
  points_earned: number;
  rarity_distribution: {
    [key in AchievementRarity]: number;
  };
}
