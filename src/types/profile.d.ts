
import { Json } from './database';

export interface CustomTheme {
  [key: string]: string; // Add index signature
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
  keyboard_shortcuts?: boolean;
  preferred_language?: string;
}

export interface DatabaseProfile extends Omit<Profile, 'custom_theme'> {
  custom_theme?: Json;
}
