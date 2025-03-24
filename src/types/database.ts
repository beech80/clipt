// Database types
import { AuthTypes } from './auth'
import { NotificationTypes } from './notifications'
import { SocialTypes } from './social'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string | null;
          followers_count: number;
          following_count: number;
          achievements_count: number;
          is_private: boolean;
          enable_notifications: boolean;
          enable_sounds: boolean;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string | null;
          followers_count?: number;
          following_count?: number;
          achievements_count?: number;
          is_private?: boolean;
          enable_notifications?: boolean;
          enable_sounds?: boolean;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string | null;
          followers_count?: number;
          following_count?: number;
          achievements_count?: number;
          is_private?: boolean;
          enable_notifications?: boolean;
          enable_sounds?: boolean;
        };
      };
      posts: {
        Row: {
          id: string;
          profile_id: string;
          title: string | null;
          content: string | null;
          image_url: string | null;
          video_url: string | null;
          created_at: string;
          updated_at: string | null;
          likes_count: number;
          comments_count: number;
          views_count: number;
          game_id: string | null;
          is_published: boolean;
        };
        Insert: {
          id?: string;
          profile_id: string;
          title?: string | null;
          content?: string | null;
          image_url?: string | null;
          video_url?: string | null;
          created_at?: string;
          updated_at?: string | null;
          likes_count?: number;
          comments_count?: number;
          views_count?: number;
          game_id?: string | null;
          is_published?: boolean;
        };
        Update: {
          id?: string;
          profile_id?: string;
          title?: string | null;
          content?: string | null;
          image_url?: string | null;
          video_url?: string | null;
          created_at?: string;
          updated_at?: string | null;
          likes_count?: number;
          comments_count?: number;
          views_count?: number;
          game_id?: string | null;
          is_published?: boolean;
        };
      };
      games: {
        Row: {
          id: string;
          name: string;
          cover_url: string | null;
          description: string | null;
          popularity: number;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          name: string;
          cover_url?: string | null;
          description?: string | null;
          popularity?: number;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          cover_url?: string | null;
          description?: string | null;
          popularity?: number;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string | null;
          is_public: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string | null;
          is_public?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string | null;
          is_public?: boolean;
        };
      };
      collection_posts: {
        Row: {
          id: string;
          collection_id: string;
          post_id: string;
          added_at: string;
        };
        Insert: {
          id?: string;
          collection_id: string;
          post_id: string;
          added_at?: string;
        };
        Update: {
          id?: string;
          collection_id?: string;
          post_id?: string;
          added_at?: string;
        };
      };
      saved_videos: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          saved_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          saved_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          saved_at?: string;
        };
      };
      // Other tables...
    };
    Functions: {
      award_user_xp: {
        Args: { user_id: string; xp_amount: number };
        Returns: number;
      };
      calculate_level_from_xp: {
        Args: { xp_value: number };
        Returns: number;
      };
      apply_xp_multiplier: {
        Args: { base_xp: number; user_id: string };
        Returns: number;
      };
      invalidate_cache: {
        Args: { cache_key: string };
        Returns: boolean;
      };
      // Add other RPC functions as needed
    };
    Views: {
      // Views definition if needed
    };
  };
}