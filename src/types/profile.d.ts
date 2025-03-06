export interface Profile {
  id: string;
  username?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  display_name?: string | null;
  bio?: string | null;
  website?: string | null;
  created_at?: string;
  enable_notifications: boolean;
  enable_sounds: boolean;
  private_profile?: boolean;
  last_username_change?: string;
}

export interface DatabaseProfile {
  id: string;
  username?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  enable_notifications?: boolean;
  enable_sounds?: boolean;
  bio?: string | null;
  display_name?: string | null;
  created_at?: string;
  website?: string | null;
  private_profile?: boolean;
  last_username_change?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  target_value: number;
  points: number;
  icon_url?: string;
  category: "streaming" | "social" | "general" | "gaming";
  created_at: string;
  updated_at: string;
  progress_type: "count" | "value" | "boolean";
  reward_type: "points" | "badge" | "title";
  reward_value: {
    points: number;
    badge?: string;
    title?: string;
  };
}

export interface AchievementProgress {
  id: string;
  user_id: string;
  achievement_id: string;
  current_value: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  achievement?: Achievement;
}

export interface GameAchievement {
  id: string;
  game_id: number;
  name: string;
  description: string;
  icon_url: string;
  points: number;
  target_value: number;
  progress: number;
  completed: boolean;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  completed_players: number;
  total_players: number;
}
