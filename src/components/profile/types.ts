export interface SocialLinks {
  twitter?: string;
  youtube?: string;
  twitch?: string;
  [key: string]: string | undefined;
}

export interface ProfileFormValues {
  username: string;
  displayName: string;
  bioDescription?: string;
  location?: string;
  website?: string;
  favoriteGame?: string;
  gamingPlatforms?: string[];
  gamerLevel?: string;
  twitchUsername?: string;
  discordUsername?: string;
  socialLinks: SocialLinks;
}

export interface DatabaseProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio_description: string | null;
  location: string | null;
  website: string | null;
  favorite_game: string | null;
  gaming_platforms: string[] | null;
  gamer_level: string | null;
  twitch_username: string | null;
  discord_username: string | null;
  social_links: SocialLinks | null;
  created_at: string;
  custom_theme: Record<string, unknown>;
  enable_notifications: boolean;
  enable_sounds: boolean;
  font_size: string;
  is_moderator: boolean;
  keyboard_shortcuts: boolean;
  onboarding_completed: boolean;
  onboarding_step: string;
  preferred_language: string;
  theme_preference: string;
}