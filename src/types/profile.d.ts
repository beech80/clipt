
export interface CustomTheme {
  primary: string;
  secondary: string;
}

export interface Profile {
  id: string;
  username?: string | null;
  avatar_url?: string | null;
  display_name?: string | null;
  bio?: string | null;
  website?: string | null;
  created_at?: string;
  custom_theme: CustomTheme;
  enable_notifications: boolean;
  enable_sounds: boolean;
  keyboard_shortcuts: boolean;
}

export interface DatabaseProfile {
  id: string;
  username?: string | null;
  avatar_url?: string | null;
  custom_theme?: Record<string, string> | null;
  enable_notifications?: boolean;
  enable_sounds?: boolean;
  bio?: string | null;
  display_name?: string | null;
  created_at?: string;
  website?: string | null;
}
