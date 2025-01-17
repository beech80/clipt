export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      accessibility_settings: {
        Row: {
          caption_size: string | null
          created_at: string | null
          high_contrast: boolean | null
          reduced_motion: boolean | null
          screen_reader_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          caption_size?: string | null
          created_at?: string | null
          high_contrast?: boolean | null
          reduced_motion?: boolean | null
          screen_reader_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          caption_size?: string | null
          created_at?: string | null
          high_contrast?: boolean | null
          reduced_motion?: boolean | null
          screen_reader_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accessibility_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      achievements: {
        Row: {
          created_at: string
          description: string
          icon_url: string | null
          id: string
          name: string
          points: number | null
        }
        Insert: {
          created_at?: string
          description: string
          icon_url?: string | null
          id?: string
          name: string
          points?: number | null
        }
        Update: {
          created_at?: string
          description?: string
          icon_url?: string | null
          id?: string
          name?: string
          points?: number | null
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_emotes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_emotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_timeouts: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          moderator_id: string
          stream_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          moderator_id: string
          stream_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          moderator_id?: string
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_timeouts_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_timeouts_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "chat_timeouts_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_timeouts_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_timeouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clip_votes: {
        Row: {
          created_at: string
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clip_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clip_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clip_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_posts: {
        Row: {
          added_at: string | null
          collection_id: string
          post_id: string
        }
        Insert: {
          added_at?: string | null
          collection_id: string
          post_id: string
        }
        Update: {
          added_at?: string | null
          collection_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_posts_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_private: boolean | null
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_private?: boolean | null
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_private?: boolean | null
          name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_filters: {
        Row: {
          category: string
          context_rules: Json | null
          created_at: string
          created_by: string | null
          filter_mode: string | null
          id: string
          is_active: boolean | null
          is_regex: boolean | null
          language: string | null
          replacement_text: string | null
          severity_level: string
          word: string
        }
        Insert: {
          category: string
          context_rules?: Json | null
          created_at?: string
          created_by?: string | null
          filter_mode?: string | null
          id?: string
          is_active?: boolean | null
          is_regex?: boolean | null
          language?: string | null
          replacement_text?: string | null
          severity_level: string
          word: string
        }
        Update: {
          category?: string
          context_rules?: Json | null
          created_at?: string
          created_by?: string | null
          filter_mode?: string | null
          id?: string
          is_active?: boolean | null
          is_regex?: boolean | null
          language?: string | null
          replacement_text?: string | null
          severity_level?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_filters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reports: {
        Row: {
          action_taken: string | null
          automated_flags: Json | null
          content_id: string
          content_type: string
          created_at: string
          id: string
          notes: string | null
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          review_priority: boolean | null
          severity_level: string
          status: string
        }
        Insert: {
          action_taken?: string | null
          automated_flags?: Json | null
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          notes?: string | null
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          review_priority?: boolean | null
          severity_level?: string
          status?: string
        }
        Update: {
          action_taken?: string | null
          automated_flags?: Json | null
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          notes?: string | null
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          review_priority?: boolean | null
          severity_level?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtags: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      keyboard_shortcuts: {
        Row: {
          action: string
          created_at: string | null
          id: string
          shortcut: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          shortcut: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          shortcut?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "keyboard_shortcuts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentions: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          mentioned_user_id: string
          mentioning_user_id: string
          post_id: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          mentioned_user_id: string
          mentioning_user_id: string
          post_id?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          mentioned_user_id?: string
          mentioning_user_id?: string
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentions_mentioned_user_id_fkey"
            columns: ["mentioned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentions_mentioning_user_id_fkey"
            columns: ["mentioning_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean | null
          receiver_id: string | null
          sender_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean | null
          receiver_id?: string | null
          sender_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean | null
          receiver_id?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          content: string | null
          created_at: string
          id: string
          read: boolean | null
          resource_id: string | null
          resource_type: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string | null
        }
        Insert: {
          actor_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          read?: boolean | null
          resource_id?: string | null
          resource_type?: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Update: {
          actor_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          read?: boolean | null
          resource_id?: string | null
          resource_type?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_analytics: {
        Row: {
          average_view_duration: unknown | null
          bounce_rate: number | null
          click_through_rate: number | null
          created_at: string | null
          engagement_rate: number | null
          id: string
          post_id: string | null
          shares_count: number | null
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          average_view_duration?: unknown | null
          bounce_rate?: number | null
          click_through_rate?: number | null
          created_at?: string | null
          engagement_rate?: number | null
          id?: string
          post_id?: string | null
          shares_count?: number | null
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          average_view_duration?: unknown | null
          bounce_rate?: number | null
          click_through_rate?: number | null
          created_at?: string | null
          engagement_rate?: number | null
          id?: string
          post_id?: string | null
          shares_count?: number | null
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_analytics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_analytics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_categories: {
        Row: {
          created_at: string
          description: string | null
          icon_url: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      post_category_mappings: {
        Row: {
          category_id: string
          created_at: string
          post_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          post_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_category_mappings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "post_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_category_mappings_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_category_mappings_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_edits: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          previous_content: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          previous_content?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          previous_content?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_edits_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_edits_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_edits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_hashtags: {
        Row: {
          created_at: string | null
          hashtag_id: string
          post_id: string
        }
        Insert: {
          created_at?: string | null
          hashtag_id: string
          post_id: string
        }
        Update: {
          created_at?: string | null
          hashtag_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_hashtags_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_hashtags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_hashtags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_views: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          viewer_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          viewer_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          user_id: string | null
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          user_id?: string | null
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          user_id?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          bio_description: string | null
          created_at: string
          custom_theme: Json | null
          display_name: string | null
          enable_notifications: boolean | null
          enable_sounds: boolean | null
          font_size: string | null
          id: string
          is_moderator: boolean | null
          keyboard_shortcuts: boolean | null
          location: string | null
          social_links: Json | null
          theme_preference: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          bio_description?: string | null
          created_at?: string
          custom_theme?: Json | null
          display_name?: string | null
          enable_notifications?: boolean | null
          enable_sounds?: boolean | null
          font_size?: string | null
          id: string
          is_moderator?: boolean | null
          keyboard_shortcuts?: boolean | null
          location?: string | null
          social_links?: Json | null
          theme_preference?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          bio_description?: string | null
          created_at?: string
          custom_theme?: Json | null
          display_name?: string | null
          enable_notifications?: boolean | null
          enable_sounds?: boolean | null
          font_size?: string | null
          id?: string
          is_moderator?: boolean | null
          keyboard_shortcuts?: boolean | null
          location?: string | null
          social_links?: Json | null
          theme_preference?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      recommended_streams: {
        Row: {
          created_at: string
          id: string
          score: number
          stream_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          score?: number
          stream_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          score?: number
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommended_streams_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "recommended_streams_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommended_streams_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommended_streams_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_analytics: {
        Row: {
          average_viewers: number | null
          average_watch_time: unknown | null
          chat_messages_count: number | null
          created_at: string | null
          engagement_rate: number | null
          id: string
          max_concurrent_viewers: number | null
          peak_viewers: number | null
          stream_duration: unknown | null
          stream_id: string | null
          total_stream_time: unknown | null
          unique_chatters: number | null
        }
        Insert: {
          average_viewers?: number | null
          average_watch_time?: unknown | null
          chat_messages_count?: number | null
          created_at?: string | null
          engagement_rate?: number | null
          id?: string
          max_concurrent_viewers?: number | null
          peak_viewers?: number | null
          stream_duration?: unknown | null
          stream_id?: string | null
          total_stream_time?: unknown | null
          unique_chatters?: number | null
        }
        Update: {
          average_viewers?: number | null
          average_watch_time?: unknown | null
          chat_messages_count?: number | null
          created_at?: string | null
          engagement_rate?: number | null
          id?: string
          max_concurrent_viewers?: number | null
          peak_viewers?: number | null
          stream_duration?: unknown | null
          stream_id?: string | null
          total_stream_time?: unknown | null
          unique_chatters?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_analytics_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "stream_analytics_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_analytics_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          thumbnail_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          thumbnail_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          thumbnail_url?: string | null
        }
        Relationships: []
      }
      stream_category_mappings: {
        Row: {
          category_id: string
          created_at: string
          stream_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          stream_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          stream_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_category_mappings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "stream_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_category_mappings_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "stream_category_mappings_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_category_mappings_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_chat: {
        Row: {
          command_type: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_command: boolean | null
          is_deleted: boolean | null
          message: string
          stream_id: string | null
          timeout_duration: number | null
          user_id: string | null
        }
        Insert: {
          command_type?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_command?: boolean | null
          is_deleted?: boolean | null
          message: string
          stream_id?: string | null
          timeout_duration?: number | null
          user_id?: string | null
        }
        Update: {
          command_type?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_command?: boolean | null
          is_deleted?: boolean | null
          message?: string
          stream_id?: string | null
          timeout_duration?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_chat_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_chat_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "stream_chat_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_chat_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_chat_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_moderators: {
        Row: {
          assigned_by: string | null
          created_at: string | null
          id: string
          moderator_id: string | null
          permissions: Json | null
          stream_id: string | null
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          moderator_id?: string | null
          permissions?: Json | null
          stream_id?: string | null
        }
        Update: {
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          moderator_id?: string | null
          permissions?: Json | null
          stream_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_moderators_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_moderators_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_moderators_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "stream_moderators_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_moderators_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_revenue: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          fee_amount: number | null
          id: string
          payment_provider: string | null
          payment_status: string | null
          revenue_type: string
          stream_id: string | null
          streamer_id: string | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          fee_amount?: number | null
          id?: string
          payment_provider?: string | null
          payment_status?: string | null
          revenue_type: string
          stream_id?: string | null
          streamer_id?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          fee_amount?: number | null
          id?: string
          payment_provider?: string | null
          payment_status?: string | null
          revenue_type?: string
          stream_id?: string | null
          streamer_id?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_revenue_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "stream_revenue_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_revenue_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_revenue_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_settings: {
        Row: {
          chat_enabled: boolean | null
          chat_followers_only: boolean | null
          chat_link_protection: boolean | null
          chat_moderation_enabled: boolean | null
          chat_slow_mode: number | null
          chat_spam_detection: boolean | null
          chat_word_filter_enabled: boolean | null
          created_at: string
          id: string
          notification_enabled: boolean | null
          stream_description_template: string | null
          stream_title_template: string | null
          user_id: string
        }
        Insert: {
          chat_enabled?: boolean | null
          chat_followers_only?: boolean | null
          chat_link_protection?: boolean | null
          chat_moderation_enabled?: boolean | null
          chat_slow_mode?: number | null
          chat_spam_detection?: boolean | null
          chat_word_filter_enabled?: boolean | null
          created_at?: string
          id?: string
          notification_enabled?: boolean | null
          stream_description_template?: string | null
          stream_title_template?: string | null
          user_id: string
        }
        Update: {
          chat_enabled?: boolean | null
          chat_followers_only?: boolean | null
          chat_link_protection?: boolean | null
          chat_moderation_enabled?: boolean | null
          chat_slow_mode?: number | null
          chat_spam_detection?: boolean | null
          chat_word_filter_enabled?: boolean | null
          created_at?: string
          id?: string
          notification_enabled?: boolean | null
          stream_description_template?: string | null
          stream_title_template?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_tag_mappings: {
        Row: {
          created_at: string
          stream_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          stream_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          stream_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_tag_mappings_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "stream_tag_mappings_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_tag_mappings_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_tag_mappings_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "stream_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_tags: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      streams: {
        Row: {
          available_qualities: Json | null
          chat_enabled: boolean | null
          created_at: string
          current_bitrate: number | null
          current_fps: number | null
          description: string | null
          ended_at: string | null
          health_status: string | null
          id: string
          is_live: boolean | null
          started_at: string | null
          stream_key: string
          stream_resolution: string | null
          stream_url: string | null
          thumbnail_url: string | null
          title: string
          user_id: string
          viewer_count: number | null
        }
        Insert: {
          available_qualities?: Json | null
          chat_enabled?: boolean | null
          created_at?: string
          current_bitrate?: number | null
          current_fps?: number | null
          description?: string | null
          ended_at?: string | null
          health_status?: string | null
          id?: string
          is_live?: boolean | null
          started_at?: string | null
          stream_key: string
          stream_resolution?: string | null
          stream_url?: string | null
          thumbnail_url?: string | null
          title: string
          user_id: string
          viewer_count?: number | null
        }
        Update: {
          available_qualities?: Json | null
          chat_enabled?: boolean | null
          created_at?: string
          current_bitrate?: number | null
          current_fps?: number | null
          description?: string | null
          ended_at?: string | null
          health_status?: string | null
          id?: string
          is_live?: boolean | null
          started_at?: string | null
          stream_key?: string
          stream_resolution?: string | null
          stream_url?: string | null
          thumbnail_url?: string | null
          title?: string
          user_id?: string
          viewer_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "streams_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      two_factor_auth: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          is_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          is_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          is_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "two_factor_auth_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_privacy_settings: {
        Row: {
          allow_mentions: boolean | null
          allow_messages: boolean | null
          created_at: string
          is_private: boolean | null
          show_activity_status: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_mentions?: boolean | null
          allow_messages?: boolean | null
          created_at?: string
          is_private?: boolean | null
          show_activity_status?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_mentions?: boolean | null
          allow_messages?: boolean | null
          created_at?: string
          is_private?: boolean | null
          show_activity_status?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_privacy_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      viewer_engagement: {
        Row: {
          created_at: string | null
          id: string
          last_active: string | null
          messages_sent: number | null
          stream_id: string | null
          viewer_id: string | null
          watch_duration: unknown | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_active?: string | null
          messages_sent?: number | null
          stream_id?: string | null
          viewer_id?: string | null
          watch_duration?: unknown | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_active?: string | null
          messages_sent?: number | null
          stream_id?: string | null
          viewer_id?: string | null
          watch_duration?: unknown | null
        }
        Relationships: [
          {
            foreignKeyName: "viewer_engagement_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "viewer_engagement_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewer_engagement_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewer_engagement_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      stream_recommendations: {
        Row: {
          description: string | null
          is_live: boolean | null
          recommendation_score: number | null
          started_at: string | null
          stream_id: string | null
          stream_url: string | null
          streamer_avatar: string | null
          streamer_id: string | null
          streamer_username: string | null
          thumbnail_url: string | null
          title: string | null
          viewer_count: number | null
          viewer_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recommended_streams_user_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "streams_user_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trending_posts: {
        Row: {
          content: string | null
          created_at: string | null
          id: string | null
          image_url: string | null
          trending_score: number | null
          user_id: string | null
          video_url: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trending_streams: {
        Row: {
          available_qualities: Json | null
          chat_enabled: boolean | null
          created_at: string | null
          current_bitrate: number | null
          current_fps: number | null
          description: string | null
          ended_at: string | null
          health_status: string | null
          id: string | null
          is_live: boolean | null
          started_at: string | null
          stream_key: string | null
          stream_resolution: string | null
          stream_url: string | null
          thumbnail_url: string | null
          title: string | null
          trending_score: number | null
          user_id: string | null
          viewer_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "streams_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_enhanced_analytics: {
        Args: {
          stream_id_param: string
        }
        Returns: {
          engagement_rate: number
          max_concurrent_viewers: number
          total_stream_time: unknown
          average_watch_time: unknown
        }[]
      }
      calculate_stream_revenue_metrics: {
        Args: {
          stream_id: string
        }
        Returns: {
          total_revenue: number
          subscription_revenue: number
          donation_revenue: number
          average_donation: number
          unique_donors: number
        }[]
      }
      calculate_trending_score: {
        Args: {
          likes_count: number
          comments_count: number
          views_count: number
          clip_votes_count: number
          hours_age: number
        }
        Returns: number
      }
      check_content_against_filters: {
        Args: {
          content_text: string
        }
        Returns: {
          matched_word: string
          category: string
          severity_level: string
          filter_mode: string
          replacement_text: string
          context_match: boolean
        }[]
      }
      generate_stream_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      gtrgm_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_options: {
        Args: {
          "": unknown
        }
        Returns: undefined
      }
      gtrgm_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      refresh_trending_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      set_limit: {
        Args: {
          "": number
        }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: {
          "": string
        }
        Returns: string[]
      }
      update_stream_recommendations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      notification_type:
        | "follow"
        | "like"
        | "comment"
        | "mention"
        | "stream_live"
        | "reply"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
