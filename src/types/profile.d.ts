
export interface CustomTheme {
  primary: string;
  secondary: string;
  accent?: string;
}

export interface DatabaseProfile {
  id: string;
  username?: string;
  avatar_url?: string;
  custom_theme?: CustomTheme;
  enable_notifications?: boolean;
  enable_sounds?: boolean;
  bio?: string;
  display_name?: string;
  created_at?: string;
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
