
export interface CustomTheme {
  primary: string;
  secondary: string;
  accent?: string;
}

export interface DatabaseProfile {
  id: string;
  username?: string;
  avatar_url?: string;
  custom_theme?: CustomTheme | null;
  enable_notifications?: boolean;
  enable_sounds?: boolean;
  bio?: string;
  display_name?: string;
  created_at?: string;
  website?: string;
}

export interface Profile extends DatabaseProfile {
  custom_theme: CustomTheme;
  enable_notifications: boolean;
  enable_sounds: boolean;
  keyboard_shortcuts?: boolean;
  hardware_acceleration?: boolean;
  reduce_animations?: boolean;
  background_processing?: boolean;
  auto_download_media?: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_url?: string;
  progress_type: 'count' | 'value' | 'boolean';
  reward_type: 'points' | 'badge' | 'title';
  reward_value: {
    points: number;
  };
  target_value: number;
  points: number;
  category: 'gaming' | 'social' | 'streaming' | 'general';
  frequency: 'one-time' | 'daily' | 'weekly' | 'monthly';
}

export interface AchievementProgress {
  achievement_id: string;
  user_id: string;
  current_value: number;
  completed?: boolean;
  earned_at?: string;
  achievement?: Achievement;
}
