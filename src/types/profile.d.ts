import { Json } from './database';

export interface CustomTheme {
  primary: string;
  secondary: string;
}

export interface Profile {
  id: string;
  username?: string | null;
  avatar_url?: string | null;
  created_at: string;
  bio?: string | null;
  website?: string | null;
  display_name?: string | null;
  custom_theme?: CustomTheme;
  theme_preference?: string;
  enable_notifications?: boolean;
  enable_sounds?: boolean;
}

export interface DatabaseProfile extends Omit<Profile, 'custom_theme'> {
  custom_theme?: Json;
}