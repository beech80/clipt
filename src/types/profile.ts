// Types for user profiles and achievements
import type { Database } from '@/integrations/supabase/types';
export type DatabaseProfile = Database['public']['Tables']['profiles']['Row'];

export interface Profile {
  banner_url?: string | null;
  last_username_change?: string | null;
  enable_notifications?: boolean;
  enable_sounds?: boolean;
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string | null;
  website?: string;
  followers?: number;
  following?: number;
  achievements?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileStats {
  followers: number;
  following: number;
  achievements: number;
}

export type AchievementCategory = 'streaming' | 'social' | 'general' | 'daily' | 'gaming';
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
