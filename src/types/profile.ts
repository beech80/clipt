// Types for user profiles and achievements

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  followers_count: number;
  following_count: number;
  achievements_count: number;
  enable_notifications: boolean;
  enable_sounds: boolean;
  auto_download_media?: boolean;
  hardware_acceleration?: boolean;
  reduce_animations?: boolean;
  background_processing?: boolean;
  streaming_url?: string;
  dark_mode?: boolean;
  theme_preference?: string;
  language_preference?: string;
  timezone_preference?: string;
  website?: string;
  updated_at?: string;
  level?: number;
  xp?: number;
  prestige?: number;
  verified?: boolean;
  selected_title?: string;
  last_username_change?: string;
  bio_description?: string;
  custom_theme?: any;
  font_size?: string;
  name?: string;
  tokens?: number;
  [key: string]: any; // Allow for additional properties
}

export interface ProfileStats {
  followers: number;
  following: number;
  achievements: number;
}

export type AchievementCategory = 'streaming' | 'social' | 'general' | 'daily' | 'gaming' | 'trophy' | 'special';
export type ProgressType = 'count' | 'value' | 'boolean';
export type RewardType = 'points' | 'badge' | 'title';

export interface Achievement {
  id?: string;
  name: string;
  description: string;
  target_value: number;
  points: number;
  category: AchievementCategory;
  progress_type: ProgressType;
  reward_type: RewardType;
  reward_value?: {
    points?: number;
    badge_id?: string;
    title_id?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface AchievementProgress {
  id?: string;
  userId?: string;
  achievementId: string;
  currentValue: number;
  completed: boolean;
  achievement: Achievement;
  created_at?: string;
  updated_at?: string;
}

export interface GameAchievement {
  id?: string;
  name: string;
  description: string;
  targetValue: number;
  points: number;
  category?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  created_at?: string;
  updated_at?: string;
  game_id?: number;
}

// Database raw profile type for accurate typing from Supabase
export interface DatabaseProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  website?: string;
  followers_count: number;
  following_count: number;
  achievements_count: number;
  created_at: string;
  updated_at?: string;
  enable_notifications: boolean;
  enable_sounds: boolean;
  auto_download_media?: boolean;
  hardware_acceleration?: boolean;
  reduce_animations?: boolean;
  background_processing?: boolean;
  streaming_url?: string;
  dark_mode?: boolean;
  theme_preference?: string;
  language_preference?: string;
  timezone_preference?: string;
}
