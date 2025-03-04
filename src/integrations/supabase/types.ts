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
      achievement_progress: {
        Row: {
          achievement_id: string | null
          created_at: string | null
          current_value: number | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          achievement_id?: string | null
          created_at?: string | null
          current_value?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          achievement_id?: string | null
          created_at?: string | null
          current_value?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "achievement_progress_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achievement_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      achievement_streaks: {
        Row: {
          achievement_id: string | null
          created_at: string | null
          current_streak: number | null
          id: string
          last_earned_at: string | null
          max_streak: number | null
          user_id: string | null
        }
        Insert: {
          achievement_id?: string | null
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_earned_at?: string | null
          max_streak?: number | null
          user_id?: string | null
        }
        Update: {
          achievement_id?: string | null
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_earned_at?: string | null
          max_streak?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "achievement_streaks_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achievement_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      achievements: {
        Row: {
          category: string | null
          chain_requirement: string | null
          created_at: string
          description: string
          frequency: string | null
          icon_url: string | null
          id: string
          name: string
          points: number | null
          progress_type: string
          reward_type: string
          reward_value: Json
          target_value: number
        }
        Insert: {
          category?: string | null
          chain_requirement?: string | null
          created_at?: string
          description: string
          frequency?: string | null
          icon_url?: string | null
          id?: string
          name: string
          points?: number | null
          progress_type?: string
          reward_type?: string
          reward_value?: Json
          target_value?: number
        }
        Update: {
          category?: string | null
          chain_requirement?: string | null
          created_at?: string
          description?: string
          frequency?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          points?: number | null
          progress_type?: string
          reward_type?: string
          reward_value?: Json
          target_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "achievements_chain_requirement_fkey"
            columns: ["chain_requirement"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_campaigns: {
        Row: {
          budget: number
          created_at: string | null
          daily_spend_limit: number | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string
          status: string | null
          targeting_rules: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget: number
          created_at?: string | null
          daily_spend_limit?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date: string
          status?: string | null
          targeting_rules?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget?: number
          created_at?: string | null
          daily_spend_limit?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string
          status?: string | null
          targeting_rules?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_creatives: {
        Row: {
          campaign_id: string
          content: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          performance_metrics: Json | null
          preview_url: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          content: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          performance_metrics?: Json | null
          preview_url?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          content?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          performance_metrics?: Json | null
          preview_url?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_creatives_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_metrics: {
        Row: {
          clicks: number | null
          conversions: number | null
          created_at: string | null
          creative_id: string
          date: string
          id: string
          impressions: number | null
          spend: number | null
          updated_at: string | null
        }
        Insert: {
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          creative_id: string
          date: string
          id?: string
          impressions?: number | null
          spend?: number | null
          updated_at?: string | null
        }
        Update: {
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          creative_id?: string
          date?: string
          id?: string
          impressions?: number | null
          spend?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_metrics_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "ad_creatives"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_placements: {
        Row: {
          availability_rules: Json | null
          base_price: number
          created_at: string | null
          id: string
          position: string
          price_model: string
          size: string
          stream_id: string | null
          updated_at: string | null
        }
        Insert: {
          availability_rules?: Json | null
          base_price: number
          created_at?: string | null
          id?: string
          position: string
          price_model: string
          size: string
          stream_id?: string | null
          updated_at?: string | null
        }
        Update: {
          availability_rules?: Json | null
          base_price?: number
          created_at?: string | null
          id?: string
          position?: string
          price_model?: string
          size?: string
          stream_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_placements_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "ad_placements_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_placements_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      application_logs: {
        Row: {
          component: string | null
          context: Json | null
          created_at: string | null
          error_stack: string | null
          id: string
          level: string
          message: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          component?: string | null
          context?: Json | null
          created_at?: string | null
          error_stack?: string | null
          id?: string
          level: string
          message: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          component?: string | null
          context?: Json | null
          created_at?: string | null
          error_stack?: string | null
          id?: string
          level?: string
          message?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_attempts: {
        Row: {
          attempt_time: string | null
          email: string | null
          id: string
          ip_address: string
          is_successful: boolean | null
        }
        Insert: {
          attempt_time?: string | null
          email?: string | null
          id?: string
          ip_address: string
          is_successful?: boolean | null
        }
        Update: {
          attempt_time?: string | null
          email?: string | null
          id?: string
          ip_address?: string
          is_successful?: boolean | null
        }
        Relationships: []
      }
      backup_logs: {
        Row: {
          backup_type: string
          completed_at: string | null
          error_message: string | null
          file_path: string | null
          id: string
          size_bytes: number | null
          started_at: string | null
          status: string
        }
        Insert: {
          backup_type: string
          completed_at?: string | null
          error_message?: string | null
          file_path?: string | null
          id?: string
          size_bytes?: number | null
          started_at?: string | null
          status: string
        }
        Update: {
          backup_type?: string
          completed_at?: string | null
          error_message?: string | null
          file_path?: string | null
          id?: string
          size_bytes?: number | null
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      batch_processing_items: {
        Row: {
          created_at: string | null
          error_message: string | null
          file_path: string
          id: string
          job_id: string | null
          output_path: string | null
          processing_time: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          file_path: string
          id?: string
          job_id?: string | null
          output_path?: string | null
          processing_time?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          file_path?: string
          id?: string
          job_id?: string | null
          output_path?: string | null
          processing_time?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "batch_processing_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "batch_processing_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_processing_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          job_type: string
          processed_items: number
          settings: Json | null
          status: string
          total_items: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          job_type: string
          processed_items?: number
          settings?: Json | null
          status?: string
          total_items?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          job_type?: string
          processed_items?: number
          settings?: Json | null
          status?: string
          total_items?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "batch_processing_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_ips: {
        Row: {
          blocked_at: string | null
          expires_at: string | null
          ip_address: string
          is_permanent: boolean | null
          reason: string | null
        }
        Insert: {
          blocked_at?: string | null
          expires_at?: string | null
          ip_address: string
          is_permanent?: boolean | null
          reason?: string | null
        }
        Update: {
          blocked_at?: string | null
          expires_at?: string | null
          ip_address?: string
          is_permanent?: boolean | null
          reason?: string | null
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
            foreignKeyName: "bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "weekly_top_clips"
            referencedColumns: ["post_id"]
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
      broadcast_presets: {
        Row: {
          audio_settings: Json
          created_at: string | null
          encoder_preset: string
          id: string
          name: string
          output_settings: Json
          updated_at: string | null
          user_id: string | null
          video_settings: Json
        }
        Insert: {
          audio_settings?: Json
          created_at?: string | null
          encoder_preset: string
          id?: string
          name: string
          output_settings?: Json
          updated_at?: string | null
          user_id?: string | null
          video_settings?: Json
        }
        Update: {
          audio_settings?: Json
          created_at?: string | null
          encoder_preset?: string
          id?: string
          name?: string
          output_settings?: Json
          updated_at?: string | null
          user_id?: string | null
          video_settings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_presets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_settings: {
        Row: {
          advanced_encoder_settings: Json | null
          created_at: string
          custom_rtmp_settings: Json | null
          encoder_settings: Json | null
          id: string
          output_settings: Json | null
          stream_delay_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          advanced_encoder_settings?: Json | null
          created_at?: string
          custom_rtmp_settings?: Json | null
          encoder_settings?: Json | null
          id?: string
          output_settings?: Json | null
          stream_delay_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          advanced_encoder_settings?: Json | null
          created_at?: string
          custom_rtmp_settings?: Json | null
          encoder_settings?: Json | null
          id?: string
          output_settings?: Json | null
          stream_delay_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_leaderboard: {
        Row: {
          achievement_points: number | null
          category: string | null
          challenge_id: string | null
          id: string
          period_end: string | null
          period_start: string | null
          rank: number | null
          score: number | null
          time_period: string | null
          total_wins: number | null
          updated_at: string | null
          user_id: string | null
          win_streak: number | null
        }
        Insert: {
          achievement_points?: number | null
          category?: string | null
          challenge_id?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          rank?: number | null
          score?: number | null
          time_period?: string | null
          total_wins?: number | null
          updated_at?: string | null
          user_id?: string | null
          win_streak?: number | null
        }
        Update: {
          achievement_points?: number | null
          category?: string | null
          challenge_id?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          rank?: number | null
          score?: number | null
          time_period?: string | null
          total_wins?: number | null
          updated_at?: string | null
          user_id?: string | null
          win_streak?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_leaderboard_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "stream_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_leaderboard_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_leaderboard_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          category: string | null
          challenge_type: string
          created_at: string | null
          current_participants: number | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          leaderboard_enabled: boolean | null
          max_participants: number | null
          min_level: number | null
          requirement_count: number | null
          reward_amount: number
          reward_type: string
          season_id: string | null
          start_date: string | null
          title: string
        }
        Insert: {
          category?: string | null
          challenge_type: string
          created_at?: string | null
          current_participants?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          leaderboard_enabled?: boolean | null
          max_participants?: number | null
          min_level?: number | null
          requirement_count?: number | null
          reward_amount: number
          reward_type: string
          season_id?: string | null
          start_date?: string | null
          title: string
        }
        Update: {
          category?: string | null
          challenge_type?: string
          created_at?: string | null
          current_participants?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          leaderboard_enabled?: boolean | null
          max_participants?: number | null
          min_level?: number | null
          requirement_count?: number | null
          reward_amount?: number
          reward_type?: string
          season_id?: string | null
          start_date?: string | null
          title?: string
        }
        Relationships: []
      }
      channel_point_rewards: {
        Row: {
          channel_id: string
          cooldown_minutes: number | null
          cost: number
          created_at: string | null
          description: string | null
          id: string
          is_enabled: boolean | null
          max_per_stream: number | null
          max_per_user_per_stream: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          channel_id: string
          cooldown_minutes?: number | null
          cost: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          max_per_stream?: number | null
          max_per_user_per_stream?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          channel_id?: string
          cooldown_minutes?: number | null
          cost?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          max_per_stream?: number | null
          max_per_user_per_stream?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_point_rewards_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_points: {
        Row: {
          channel_id: string
          created_at: string | null
          id: string
          points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string | null
          id?: string
          points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string | null
          id?: string
          points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_points_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_analytics: {
        Row: {
          average_message_length: number | null
          commands_used: number | null
          created_at: string | null
          id: string
          messages_deleted: number | null
          peak_messages_per_minute: number | null
          stream_id: string | null
          timeouts_issued: number | null
          total_messages: number | null
          unique_chatters: number | null
          updated_at: string | null
        }
        Insert: {
          average_message_length?: number | null
          commands_used?: number | null
          created_at?: string | null
          id?: string
          messages_deleted?: number | null
          peak_messages_per_minute?: number | null
          stream_id?: string | null
          timeouts_issued?: number | null
          total_messages?: number | null
          unique_chatters?: number | null
          updated_at?: string | null
        }
        Update: {
          average_message_length?: number | null
          commands_used?: number | null
          created_at?: string | null
          id?: string
          messages_deleted?: number | null
          peak_messages_per_minute?: number | null
          stream_id?: string | null
          timeouts_issued?: number | null
          total_messages?: number | null
          unique_chatters?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_analytics_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "chat_analytics_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_analytics_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_badges: {
        Row: {
          condition: Json
          created_at: string | null
          created_by: string | null
          id: string
          image_url: string
          name: string
          priority: number | null
        }
        Insert: {
          condition?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          image_url: string
          name: string
          priority?: number | null
        }
        Update: {
          condition?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          image_url?: string
          name?: string
          priority?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_badges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_commands: {
        Row: {
          cooldown_seconds: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          enabled: boolean | null
          id: string
          moderator_only: boolean | null
          name: string
          response_template: string | null
        }
        Insert: {
          cooldown_seconds?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          moderator_only?: boolean | null
          name: string
          response_template?: string | null
        }
        Update: {
          cooldown_seconds?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          moderator_only?: boolean | null
          name?: string
          response_template?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_commands_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_emotes: {
        Row: {
          animated: boolean | null
          category: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          permissions: Json | null
          url: string
        }
        Insert: {
          animated?: boolean | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          permissions?: Json | null
          url: string
        }
        Update: {
          animated?: boolean | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          permissions?: Json | null
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
      chat_filters: {
        Row: {
          created_at: string | null
          created_by: string | null
          filter_type: string
          id: string
          is_regex: boolean | null
          pattern: string
          replacement: string | null
          stream_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          filter_type: string
          id?: string
          is_regex?: boolean | null
          pattern: string
          replacement?: string | null
          stream_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          filter_type?: string
          id?: string
          is_regex?: boolean | null
          pattern?: string
          replacement?: string | null
          stream_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_filters_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "chat_filters_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_filters_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_highlights: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          message_id: string
          pinned: boolean | null
          pinned_at: string | null
          pinned_by: string | null
          stream_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          message_id: string
          pinned?: boolean | null
          pinned_at?: string | null
          pinned_by?: string | null
          stream_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          message_id?: string
          pinned?: boolean | null
          pinned_at?: string | null
          pinned_by?: string | null
          stream_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_highlights_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_highlights_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "stream_chat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_highlights_pinned_by_fkey"
            columns: ["pinned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_highlights_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "chat_highlights_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_highlights_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_message_history: {
        Row: {
          badges: Json | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_deleted: boolean | null
          message: string
          stream_id: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          badges?: Json | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          message: string
          stream_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          badges?: Json | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          message?: string
          stream_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_history_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_history_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "chat_message_history_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_history_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rate_limits: {
        Row: {
          id: string
          message_count: number | null
          stream_id: string
          user_id: string
          window_start: string | null
        }
        Insert: {
          id?: string
          message_count?: number | null
          stream_id: string
          user_id: string
          window_start?: string | null
        }
        Update: {
          id?: string
          message_count?: number | null
          stream_id?: string
          user_id?: string
          window_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_rate_limits_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "chat_rate_limits_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rate_limits_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
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
      chatbot_commands: {
        Row: {
          command: string
          config_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_enabled: boolean | null
          response_template: string | null
        }
        Insert: {
          command: string
          config_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          response_template?: string | null
        }
        Update: {
          command?: string
          config_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          response_template?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_commands_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "chatbot_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_configurations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          model_settings: Json | null
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          model_settings?: Json | null
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          model_settings?: Json | null
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_configurations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_conversations: {
        Row: {
          config_id: string | null
          created_at: string | null
          game_context: string | null
          id: string
          message: string
          response: string
          user_id: string | null
        }
        Insert: {
          config_id?: string | null
          created_at?: string | null
          game_context?: string | null
          id?: string
          message: string
          response: string
          user_id?: string | null
        }
        Update: {
          config_id?: string | null
          created_at?: string | null
          game_context?: string | null
          id?: string
          message?: string
          response?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_conversations_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "chatbot_configurations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clip_editing_sessions: {
        Row: {
          clip_id: string | null
          created_at: string
          edit_history: Json[] | null
          effects: Json
          id: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          clip_id?: string | null
          created_at?: string
          edit_history?: Json[] | null
          effects?: Json
          id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          clip_id?: string | null
          created_at?: string
          edit_history?: Json[] | null
          effects?: Json
          id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clip_editing_sessions_clip_id_fkey"
            columns: ["clip_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clip_editing_sessions_clip_id_fkey"
            columns: ["clip_id"]
            isOneToOne: false
            referencedRelation: "trending_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clip_editing_sessions_clip_id_fkey"
            columns: ["clip_id"]
            isOneToOne: false
            referencedRelation: "weekly_top_clips"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "clip_editing_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clip_effects: {
        Row: {
          created_at: string
          id: string
          is_premium: boolean | null
          name: string
          preview_url: string | null
          settings: Json
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_premium?: boolean | null
          name: string
          preview_url?: string | null
          settings?: Json
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_premium?: boolean | null
          name?: string
          preview_url?: string | null
          settings?: Json
          type?: string
        }
        Relationships: []
      }
      clip_templates: {
        Row: {
          created_at: string | null
          id: string
          is_public: boolean | null
          name: string
          template_data: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          template_data: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          template_data?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clip_templates_user_id_fkey"
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
            foreignKeyName: "clip_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "weekly_top_clips"
            referencedColumns: ["post_id"]
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
      collab_streams: {
        Row: {
          collaborator_id: string | null
          id: string
          joined_at: string | null
          main_stream_id: string | null
          permissions: Json | null
          role: string
          status: string | null
        }
        Insert: {
          collaborator_id?: string | null
          id?: string
          joined_at?: string | null
          main_stream_id?: string | null
          permissions?: Json | null
          role: string
          status?: string | null
        }
        Update: {
          collaborator_id?: string | null
          id?: string
          joined_at?: string | null
          main_stream_id?: string | null
          permissions?: Json | null
          role?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collab_streams_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_streams_main_stream_id_fkey"
            columns: ["main_stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "collab_streams_main_stream_id_fkey"
            columns: ["main_stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_streams_main_stream_id_fkey"
            columns: ["main_stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
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
          {
            foreignKeyName: "collection_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "weekly_top_clips"
            referencedColumns: ["post_id"]
          },
        ]
      }
      collections: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_private: boolean | null
          last_modified_at: string | null
          name: string
          sort_order: number | null
          tags: string[] | null
          thumbnail_url: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_private?: boolean | null
          last_modified_at?: string | null
          name: string
          sort_order?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_private?: boolean | null
          last_modified_at?: string | null
          name?: string
          sort_order?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
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
      comment_likes: {
        Row: {
          comment_id: string | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          likes_count: number | null
          parent_id: string | null
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          likes_count?: number | null
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
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "weekly_top_clips"
            referencedColumns: ["post_id"]
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
      content_filter_settings: {
        Row: {
          created_at: string
          custom_keywords: string[] | null
          excluded_tags: string[] | null
          excluded_users: string[] | null
          filter_nsfw: boolean | null
          filter_spam: boolean | null
          filter_violence: boolean | null
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          custom_keywords?: string[] | null
          excluded_tags?: string[] | null
          excluded_users?: string[] | null
          filter_nsfw?: boolean | null
          filter_spam?: boolean | null
          filter_violence?: boolean | null
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          custom_keywords?: string[] | null
          excluded_tags?: string[] | null
          excluded_users?: string[] | null
          filter_nsfw?: boolean | null
          filter_spam?: boolean | null
          filter_violence?: boolean | null
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_filter_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_filters: {
        Row: {
          action_type: string | null
          category: string
          context_rules: Json | null
          created_at: string
          created_by: string | null
          filter_mode: string | null
          id: string
          is_active: boolean | null
          is_regex: boolean | null
          language: string | null
          priority: number | null
          replacement_text: string | null
          severity_level: string
          word: string
        }
        Insert: {
          action_type?: string | null
          category: string
          context_rules?: Json | null
          created_at?: string
          created_by?: string | null
          filter_mode?: string | null
          id?: string
          is_active?: boolean | null
          is_regex?: boolean | null
          language?: string | null
          priority?: number | null
          replacement_text?: string | null
          severity_level: string
          word: string
        }
        Update: {
          action_type?: string | null
          category?: string
          context_rules?: Json | null
          created_at?: string
          created_by?: string | null
          filter_mode?: string | null
          id?: string
          is_active?: boolean | null
          is_regex?: boolean | null
          language?: string | null
          priority?: number | null
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
      content_performance_predictions: {
        Row: {
          confidence_score: number | null
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          predicted_engagement_rate: number | null
          predicted_peak_concurrent: number | null
          predicted_views: number | null
          prediction_model_version: string | null
        }
        Insert: {
          confidence_score?: number | null
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          predicted_engagement_rate?: number | null
          predicted_peak_concurrent?: number | null
          predicted_views?: number | null
          prediction_model_version?: string | null
        }
        Update: {
          confidence_score?: number | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          predicted_engagement_rate?: number | null
          predicted_peak_concurrent?: number | null
          predicted_views?: number | null
          prediction_model_version?: string | null
        }
        Relationships: []
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
      content_scores: {
        Row: {
          adult_score: number | null
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          spam_score: number | null
          threat_score: number | null
          toxicity_score: number | null
        }
        Insert: {
          adult_score?: number | null
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          spam_score?: number | null
          threat_score?: number | null
          toxicity_score?: number | null
        }
        Update: {
          adult_score?: number | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          spam_score?: number | null
          threat_score?: number | null
          toxicity_score?: number | null
        }
        Relationships: []
      }
      content_similarities: {
        Row: {
          content_type: string
          created_at: string | null
          id: string
          similarity_score: number
          source_id: string
          target_id: string
        }
        Insert: {
          content_type: string
          created_at?: string | null
          id?: string
          similarity_score: number
          source_id: string
          target_id: string
        }
        Update: {
          content_type?: string
          created_at?: string | null
          id?: string
          similarity_score?: number
          source_id?: string
          target_id?: string
        }
        Relationships: []
      }
      creator_analytics: {
        Row: {
          created_at: string | null
          engagement_rate: number | null
          id: string
          revenue_total: number | null
          updated_at: string | null
          user_id: string | null
          views_count: number | null
        }
        Insert: {
          created_at?: string | null
          engagement_rate?: number | null
          id?: string
          revenue_total?: number | null
          updated_at?: string | null
          user_id?: string | null
          views_count?: number | null
        }
        Update: {
          created_at?: string | null
          engagement_rate?: number | null
          id?: string
          revenue_total?: number | null
          updated_at?: string | null
          user_id?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_overlays: {
        Row: {
          created_at: string
          css_content: string | null
          html_content: string | null
          id: string
          is_active: boolean | null
          js_content: string | null
          name: string
          settings: Json
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          css_content?: string | null
          html_content?: string | null
          id?: string
          is_active?: boolean | null
          js_content?: string | null
          name: string
          settings?: Json
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          css_content?: string | null
          html_content?: string | null
          id?: string
          is_active?: boolean | null
          js_content?: string | null
          name?: string
          settings?: Json
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_overlays_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      data_retention_policies: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          resource_type: string
          retention_period: unknown
          updated_at: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          resource_type: string
          retention_period: unknown
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          resource_type?: string
          retention_period?: unknown
          updated_at?: string | null
        }
        Relationships: []
      }
      discord_connections: {
        Row: {
          access_token: string
          created_at: string | null
          discord_id: string
          discord_username: string
          expires_at: string
          id: string
          refresh_token: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_token: string
          created_at?: string | null
          discord_id: string
          discord_username: string
          expires_at: string
          id?: string
          refresh_token: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string | null
          discord_id?: string
          discord_username?: string
          expires_at?: string
          id?: string
          refresh_token?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discord_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_trends: {
        Row: {
          created_at: string | null
          id: string
          metrics: Json
          period_end: string
          period_start: string
          trend_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metrics: Json
          period_end: string
          period_start: string
          trend_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metrics?: Json
          period_end?: string
          period_start?: string
          trend_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_trends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      error_reports: {
        Row: {
          browser_info: Json | null
          component_stack: string | null
          created_at: string | null
          error_type: string
          id: string
          message: string
          stack_trace: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          browser_info?: Json | null
          component_stack?: string | null
          created_at?: string | null
          error_type: string
          id?: string
          message: string
          stack_trace?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          browser_info?: Json | null
          component_stack?: string | null
          created_at?: string | null
          error_type?: string
          id?: string
          message?: string
          stack_trace?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      esports_team_members: {
        Row: {
          joined_at: string | null
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string | null
          role: string
          team_id: string
          user_id: string
        }
        Update: {
          joined_at?: string | null
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "esports_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "esports_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "esports_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      esports_teams: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string | null
          tag: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id?: string | null
          tag: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          tag?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "esports_teams_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      external_shares: {
        Row: {
          created_at: string
          id: string
          platform: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "weekly_top_clips"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "external_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      failed_operations: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          last_retry_at: string | null
          max_retries: number | null
          next_retry_at: string | null
          operation_type: string
          payload: Json | null
          resource_id: string
          resource_type: string
          retry_count: number | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_retry_at?: string | null
          max_retries?: number | null
          next_retry_at?: string | null
          operation_type: string
          payload?: Json | null
          resource_id: string
          resource_type: string
          retry_count?: number | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_retry_at?: string | null
          max_retries?: number | null
          next_retry_at?: string | null
          operation_type?: string
          payload?: Json | null
          resource_id?: string
          resource_type?: string
          retry_count?: number | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      feedback_votes: {
        Row: {
          created_at: string | null
          feedback_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feedback_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          feedback_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_votes_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "user_feedback"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_votes_user_id_fkey"
            columns: ["user_id"]
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
      game_categories: {
        Row: {
          age_rating: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          platform_support: string[] | null
          popularity_score: number | null
          release_date: string | null
          slug: string
          tags: string[] | null
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          age_rating?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          platform_support?: string[] | null
          popularity_score?: number | null
          release_date?: string | null
          slug: string
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          age_rating?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          platform_support?: string[] | null
          popularity_score?: number | null
          release_date?: string | null
          slug?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      games: {
        Row: {
          cover_url: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      gaming_history: {
        Row: {
          activity_type: string
          created_at: string | null
          details: Json
          game_type: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          details?: Json
          game_type?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          details?: Json
          game_type?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gaming_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_chat_invites: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          group_id: string | null
          id: string
          invite_code: string
          max_uses: number | null
          uses: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          group_id?: string | null
          id?: string
          invite_code: string
          max_uses?: number | null
          uses?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          group_id?: string | null
          id?: string
          invite_code?: string
          max_uses?: number | null
          uses?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "group_chat_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_chat_invites_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "group_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      group_chat_members: {
        Row: {
          group_id: string
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          joined_at?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_chat_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "group_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_chat_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_chats: {
        Row: {
          avatar_url: string | null
          chat_rules: string[] | null
          created_at: string
          created_by: string
          custom_emotes: Json | null
          description: string | null
          id: string
          is_private: boolean | null
          max_members: number | null
          name: string
          slow_mode_interval: number | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          chat_rules?: string[] | null
          created_at?: string
          created_by: string
          custom_emotes?: Json | null
          description?: string | null
          id?: string
          is_private?: boolean | null
          max_members?: number | null
          name: string
          slow_mode_interval?: number | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          chat_rules?: string[] | null
          created_at?: string
          created_by?: string
          custom_emotes?: Json | null
          description?: string | null
          id?: string
          is_private?: boolean | null
          max_members?: number | null
          name?: string
          slow_mode_interval?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_chats_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          content: string
          created_at: string
          deleted_by: string | null
          group_id: string
          id: string
          is_deleted: boolean | null
          sender_id: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          deleted_by?: string | null
          group_id: string
          id?: string
          is_deleted?: boolean | null
          sender_id?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          deleted_by?: string | null
          group_id?: string
          id?: string
          is_deleted?: boolean | null
          sender_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "group_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_sender_id_fkey"
            columns: ["sender_id"]
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
      level_rewards: {
        Row: {
          created_at: string | null
          id: string
          level: number
          reward_type: string
          reward_value: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          level: number
          reward_type: string
          reward_value?: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: number
          reward_type?: string
          reward_value?: Json
        }
        Relationships: []
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
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "weekly_top_clips"
            referencedColumns: ["post_id"]
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
          {
            foreignKeyName: "mentions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "weekly_top_clips"
            referencedColumns: ["post_id"]
          },
        ]
      }
      merchandise_order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          price_at_time: number
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          price_at_time: number
          product_id: string
          quantity: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          price_at_time?: number
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "merchandise_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "merchandise_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchandise_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "merchandise_products"
            referencedColumns: ["id"]
          },
        ]
      }
      merchandise_orders: {
        Row: {
          buyer_id: string
          created_at: string | null
          id: string
          seller_id: string
          shipping_address: Json
          status: string
          total_amount: number
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          id?: string
          seller_id: string
          shipping_address: Json
          status?: string
          total_amount: number
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          id?: string
          seller_id?: string
          shipping_address?: Json
          status?: string
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchandise_orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchandise_orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchandise_products: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price: number
          stock_quantity: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price: number
          stock_quantity?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: number
          stock_quantity?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchandise_products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_attachments: {
        Row: {
          created_at: string | null
          file_type: string
          file_url: string
          id: string
          message_id: string | null
          thumbnail_url: string | null
        }
        Insert: {
          created_at?: string | null
          file_type: string
          file_url: string
          id?: string
          message_id?: string | null
          thumbnail_url?: string | null
        }
        Update: {
          created_at?: string | null
          file_type?: string
          file_url?: string
          id?: string
          message_id?: string | null
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          edited_at: string | null
          id: string
          is_edited: boolean | null
          message_type: string | null
          metadata: Json | null
          reactions: Json | null
          read: boolean | null
          receiver_id: string | null
          reply_to: string | null
          sender_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          message_type?: string | null
          metadata?: Json | null
          reactions?: Json | null
          read?: boolean | null
          receiver_id?: string | null
          reply_to?: string | null
          sender_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          message_type?: string | null
          metadata?: Json | null
          reactions?: Json | null
          read?: boolean | null
          receiver_id?: string | null
          reply_to?: string | null
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
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages"
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
      mux_assets: {
        Row: {
          asset_id: string
          created_at: string
          id: string
          playback_id: string
          post_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          id?: string
          playback_id: string
          post_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          id?: string
          playback_id?: string
          post_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mux_assets_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mux_assets_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mux_assets_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "weekly_top_clips"
            referencedColumns: ["post_id"]
          },
        ]
      }
      mux_uploads: {
        Row: {
          asset_id: string | null
          created_at: string | null
          id: string
          status: string | null
          updated_at: string | null
          upload_id: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          asset_id?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          upload_id?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          asset_id?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          upload_id?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mux_uploads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          follower_notifications: boolean | null
          mention_notifications: boolean | null
          push_notifications: boolean | null
          stream_notifications: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          follower_notifications?: boolean | null
          mention_notifications?: boolean | null
          push_notifications?: boolean | null
          stream_notifications?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          follower_notifications?: boolean | null
          mention_notifications?: boolean | null
          push_notifications?: boolean | null
          stream_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
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
      obs_connection_logs: {
        Row: {
          connected_at: string | null
          connection_quality: Json | null
          disconnected_at: string | null
          id: string
          obs_version: string | null
          settings_used: Json | null
          stream_id: string | null
        }
        Insert: {
          connected_at?: string | null
          connection_quality?: Json | null
          disconnected_at?: string | null
          id?: string
          obs_version?: string | null
          settings_used?: Json | null
          stream_id?: string | null
        }
        Update: {
          connected_at?: string | null
          connection_quality?: Json | null
          disconnected_at?: string | null
          id?: string
          obs_version?: string | null
          settings_used?: Json | null
          stream_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_stream"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "fk_stream"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_stream"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obs_connection_logs_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "obs_connection_logs_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obs_connection_logs_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      obs_server_status: {
        Row: {
          current_load: number | null
          id: string
          is_primary: boolean | null
          last_checked: string | null
          region: string | null
          server_url: string
          status: string | null
        }
        Insert: {
          current_load?: number | null
          id?: string
          is_primary?: boolean | null
          last_checked?: string | null
          region?: string | null
          server_url: string
          status?: string | null
        }
        Update: {
          current_load?: number | null
          id?: string
          is_primary?: boolean | null
          last_checked?: string | null
          region?: string | null
          server_url?: string
          status?: string | null
        }
        Relationships: []
      }
      onboarding_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          id: string
          step_name: string
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          step_name: string
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          step_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      onboarding_steps: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          step_name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          step_name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          step_name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          id: string
          metric_name: string
          tags: Json | null
          timestamp: string | null
          value: number
        }
        Insert: {
          id?: string
          metric_name: string
          tags?: Json | null
          timestamp?: string | null
          value: number
        }
        Update: {
          id?: string
          metric_name?: string
          tags?: Json | null
          timestamp?: string | null
          value?: number
        }
        Relationships: []
      }
      performance_metrics_enhanced: {
        Row: {
          browser_info: Json | null
          component: string | null
          id: string
          metadata: Json | null
          metric_name: string
          page_url: string | null
          timestamp: string | null
          user_id: string | null
          value: number
        }
        Insert: {
          browser_info?: Json | null
          component?: string | null
          id?: string
          metadata?: Json | null
          metric_name: string
          page_url?: string | null
          timestamp?: string | null
          user_id?: string | null
          value: number
        }
        Update: {
          browser_info?: Json | null
          component?: string | null
          id?: string
          metadata?: Json | null
          metric_name?: string
          page_url?: string | null
          timestamp?: string | null
          user_id?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "performance_metrics_enhanced_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_analytics: {
        Row: {
          active_streams: number | null
          created_at: string | null
          daily_stats: Json | null
          id: string
          peak_concurrent: number | null
          total_engagement: number | null
          total_users: number | null
          updated_at: string | null
        }
        Insert: {
          active_streams?: number | null
          created_at?: string | null
          daily_stats?: Json | null
          id?: string
          peak_concurrent?: number | null
          total_engagement?: number | null
          total_users?: number | null
          updated_at?: string | null
        }
        Update: {
          active_streams?: number | null
          created_at?: string | null
          daily_stats?: Json | null
          id?: string
          peak_concurrent?: number | null
          total_engagement?: number | null
          total_users?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      platform_stream_status: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          last_heartbeat: string | null
          platform_id: string | null
          platform_stream_id: string | null
          platform_stream_url: string | null
          status: string
          stream_id: string | null
          updated_at: string | null
          viewer_count: number | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_heartbeat?: string | null
          platform_id?: string | null
          platform_stream_id?: string | null
          platform_stream_url?: string | null
          status?: string
          stream_id?: string | null
          updated_at?: string | null
          viewer_count?: number | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_heartbeat?: string | null
          platform_id?: string | null
          platform_stream_id?: string | null
          platform_stream_url?: string | null
          status?: string
          stream_id?: string | null
          updated_at?: string | null
          viewer_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_stream_status_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "streaming_platforms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_stream_status_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "platform_stream_status_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_stream_status_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_responses: {
        Row: {
          created_at: string | null
          id: string
          poll_id: string | null
          selected_options: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          poll_id?: string | null
          selected_options: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          poll_id?: string | null
          selected_options?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_responses_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "stream_polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_responses_user_id_fkey"
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
          hashtag_clicks: number | null
          id: string
          interaction_types: Json | null
          post_id: string | null
          share_clicks: number | null
          shares_count: number | null
          time_spent_seconds: number | null
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          average_view_duration?: unknown | null
          bounce_rate?: number | null
          click_through_rate?: number | null
          created_at?: string | null
          engagement_rate?: number | null
          hashtag_clicks?: number | null
          id?: string
          interaction_types?: Json | null
          post_id?: string | null
          share_clicks?: number | null
          shares_count?: number | null
          time_spent_seconds?: number | null
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          average_view_duration?: unknown | null
          bounce_rate?: number | null
          click_through_rate?: number | null
          created_at?: string | null
          engagement_rate?: number | null
          hashtag_clicks?: number | null
          id?: string
          interaction_types?: Json | null
          post_id?: string | null
          share_clicks?: number | null
          shares_count?: number | null
          time_spent_seconds?: number | null
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
          {
            foreignKeyName: "post_analytics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "weekly_top_clips"
            referencedColumns: ["post_id"]
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
          {
            foreignKeyName: "post_category_mappings_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "weekly_top_clips"
            referencedColumns: ["post_id"]
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
            foreignKeyName: "post_edits_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "weekly_top_clips"
            referencedColumns: ["post_id"]
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
      post_filters: {
        Row: {
          created_at: string | null
          filter_type: string
          filter_value: Json
          id: string
          is_default: boolean | null
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          filter_type: string
          filter_value: Json
          id?: string
          is_default?: boolean | null
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          filter_type?: string
          filter_value?: Json
          id?: string
          is_default?: boolean | null
          name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_filters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_game_categories: {
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
            foreignKeyName: "post_game_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "game_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_game_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "top_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_game_categories_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_game_categories_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_game_categories_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "weekly_top_clips"
            referencedColumns: ["post_id"]
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
          {
            foreignKeyName: "post_hashtags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "weekly_top_clips"
            referencedColumns: ["post_id"]
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
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "weekly_top_clips"
            referencedColumns: ["post_id"]
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
          game_id: string | null
          id: string
          image_url: string | null
          is_premium: boolean | null
          is_published: boolean | null
          is_subscriber_only: boolean | null
          post_type: string | null
          required_tier_id: string | null
          scheduled_publish_time: string | null
          user_id: string | null
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          game_id?: string | null
          id?: string
          image_url?: string | null
          is_premium?: boolean | null
          is_published?: boolean | null
          is_subscriber_only?: boolean | null
          post_type?: string | null
          required_tier_id?: string | null
          scheduled_publish_time?: string | null
          user_id?: string | null
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          game_id?: string | null
          id?: string
          image_url?: string | null
          is_premium?: boolean | null
          is_published?: boolean | null
          is_subscriber_only?: boolean | null
          post_type?: string | null
          required_tier_id?: string | null
          scheduled_publish_time?: string | null
          user_id?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_required_tier_id_fkey"
            columns: ["required_tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prediction_bets: {
        Row: {
          created_at: string | null
          id: string
          option_index: number
          points_wagered: number
          points_won: number | null
          prediction_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_index: number
          points_wagered: number
          points_won?: number | null
          prediction_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_index?: number
          points_wagered?: number
          points_won?: number | null
          prediction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prediction_bets_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "stream_predictions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prediction_bets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_badges: {
        Row: {
          achievement_id: string | null
          created_at: string | null
          display_order: number | null
          id: string
          is_featured: boolean | null
          user_id: string | null
        }
        Insert: {
          achievement_id?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          user_id?: string | null
        }
        Update: {
          achievement_id?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_badges_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_badges_user_id_fkey"
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
          is_verified: boolean | null
          keyboard_shortcuts: boolean | null
          location: string | null
          onboarding_completed: boolean | null
          onboarding_step: string | null
          preferred_language: string | null
          social_links: Json | null
          theme_preference: string | null
          username: string | null
          verification_approved_at: string | null
          verification_rejected_at: string | null
          verification_rejected_reason: string | null
          verification_requested_at: string | null
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
          is_verified?: boolean | null
          keyboard_shortcuts?: boolean | null
          location?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: string | null
          preferred_language?: string | null
          social_links?: Json | null
          theme_preference?: string | null
          username?: string | null
          verification_approved_at?: string | null
          verification_rejected_at?: string | null
          verification_rejected_reason?: string | null
          verification_requested_at?: string | null
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
          is_verified?: boolean | null
          keyboard_shortcuts?: boolean | null
          location?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: string | null
          preferred_language?: string | null
          social_links?: Json | null
          theme_preference?: string | null
          username?: string | null
          verification_approved_at?: string | null
          verification_rejected_at?: string | null
          verification_rejected_reason?: string | null
          verification_requested_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_preferred_language_fkey"
            columns: ["preferred_language"]
            isOneToOne: false
            referencedRelation: "supported_languages"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_presets: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          settings: Json
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          settings?: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          settings?: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quality_presets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_responses: {
        Row: {
          answers: Json
          created_at: string | null
          id: string
          quiz_id: string | null
          score: number | null
          user_id: string | null
        }
        Insert: {
          answers: Json
          created_at?: string | null
          id?: string
          quiz_id?: string | null
          score?: number | null
          user_id?: string | null
        }
        Update: {
          answers?: Json
          created_at?: string | null
          id?: string
          quiz_id?: string | null
          score?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_responses_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "stream_quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          endpoint: string
          id: string
          ip_address: string
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          endpoint: string
          id?: string
          ip_address: string
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          endpoint?: string
          id?: string
          ip_address?: string
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string | null
          reaction_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          post_id?: string | null
          reaction_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string | null
          reaction_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "weekly_top_clips"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      revenue_forecasts: {
        Row: {
          confidence_interval: Json | null
          created_at: string | null
          forecast_model_version: string | null
          forecast_period: string
          id: string
          metadata: Json | null
          predicted_amount: number
          user_id: string | null
        }
        Insert: {
          confidence_interval?: Json | null
          created_at?: string | null
          forecast_model_version?: string | null
          forecast_period: string
          id?: string
          metadata?: Json | null
          predicted_amount: number
          user_id?: string | null
        }
        Update: {
          confidence_interval?: Json | null
          created_at?: string | null
          forecast_model_version?: string | null
          forecast_period?: string
          id?: string
          metadata?: Json | null
          predicted_amount?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_forecasts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scene_sources: {
        Row: {
          created_at: string
          id: string
          name: string
          position: Json
          scene_id: string
          settings: Json
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          position?: Json
          scene_id: string
          settings?: Json
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          position?: Json
          scene_id?: string
          settings?: Json
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scene_sources_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      scenes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          layout: Json
          name: string
          sort_order: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          layout?: Json
          name: string
          sort_order?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          layout?: Json
          name?: string
          sort_order?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          category: string | null
          created_at: string | null
          filters: Json | null
          id: string
          query: string
          result_count: number | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          filters?: Json | null
          id?: string
          query: string
          result_count?: number | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          filters?: Json | null
          id?: string
          query?: string
          result_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          is_active: boolean | null
          multiplier: number | null
          name: string
          start_date: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          multiplier?: number | null
          name: string
          start_date: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          multiplier?: number | null
          name?: string
          start_date?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          resolution_notes: string | null
          resolved_at: string | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      share_settings: {
        Row: {
          created_at: string | null
          embed_code: string | null
          embed_enabled: boolean | null
          id: string
          post_id: string | null
          share_url: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          embed_code?: string | null
          embed_enabled?: boolean | null
          id?: string
          post_id?: string | null
          share_url?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          embed_code?: string | null
          embed_enabled?: boolean | null
          id?: string
          post_id?: string | null
          share_url?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "share_settings_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_settings_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_settings_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "weekly_top_clips"
            referencedColumns: ["post_id"]
          },
        ]
      }
      sponsored_streams: {
        Row: {
          created_at: string | null
          end_time: string | null
          id: string
          sponsor_link: string | null
          sponsor_logo_url: string | null
          sponsor_name: string
          sponsorship_terms: string | null
          start_time: string | null
          stream_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_time?: string | null
          id?: string
          sponsor_link?: string | null
          sponsor_logo_url?: string | null
          sponsor_name: string
          sponsorship_terms?: string | null
          start_time?: string | null
          stream_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string | null
          id?: string
          sponsor_link?: string | null
          sponsor_logo_url?: string | null
          sponsor_name?: string
          sponsorship_terms?: string | null
          start_time?: string | null
          stream_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsored_streams_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "sponsored_streams_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsored_streams_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      squad_members: {
        Row: {
          joined_at: string | null
          role: string | null
          squad_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string | null
          role?: string | null
          squad_id: string
          user_id: string
        }
        Update: {
          joined_at?: string | null
          role?: string | null
          squad_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_members_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      squads: {
        Row: {
          created_at: string | null
          game_type: string | null
          id: string
          leader_id: string
          max_size: number | null
          name: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          game_type?: string | null
          id?: string
          leader_id: string
          max_size?: number | null
          name: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          game_type?: string | null
          id?: string
          leader_id?: string
          max_size?: number | null
          name?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "squads_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          background_color: string | null
          created_at: string
          expires_at: string
          font_style: string | null
          id: string
          is_expired: boolean | null
          media_type: string
          media_url: string
          sticker_data: Json | null
          text_content: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          background_color?: string | null
          created_at?: string
          expires_at: string
          font_style?: string | null
          id?: string
          is_expired?: boolean | null
          media_type: string
          media_url: string
          sticker_data?: Json | null
          text_content?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          background_color?: string | null
          created_at?: string
          expires_at?: string
          font_style?: string | null
          id?: string
          is_expired?: boolean | null
          media_type?: string
          media_url?: string
          sticker_data?: Json | null
          text_content?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          id: string
          story_id: string | null
          viewed_at: string | null
          viewer_id: string | null
        }
        Insert: {
          id?: string
          story_id?: string | null
          viewed_at?: string | null
          viewer_id?: string | null
        }
        Update: {
          id?: string
          story_id?: string | null
          viewed_at?: string | null
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_alert_queue: {
        Row: {
          alert_type: string
          created_at: string | null
          data: Json
          id: string
          played: boolean | null
          played_at: string | null
          stream_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          data: Json
          id?: string
          played?: boolean | null
          played_at?: string | null
          stream_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          data?: Json
          id?: string
          played?: boolean | null
          played_at?: string | null
          stream_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_alert_queue_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "stream_alert_queue_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_alert_queue_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          enabled: boolean | null
          id: string
          message_template: string
          styles: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          message_template: string
          styles?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          message_template?: string
          styles?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_analytics: {
        Row: {
          audio_quality_score: number | null
          average_session_duration: unknown | null
          average_viewers: number | null
          average_watch_time: unknown | null
          bounce_rate: number | null
          buffer_ratio: number | null
          chat_messages_count: number | null
          created_at: string | null
          dropped_frames_ratio: number | null
          engagement_rate: number | null
          game_performance_score: number | null
          id: string
          interaction_rate: number | null
          max_concurrent_viewers: number | null
          peak_concurrent_chatters: number | null
          peak_viewers: number | null
          retention_rate: number | null
          stream_duration: unknown | null
          stream_id: string | null
          stream_quality_score: number | null
          total_stream_time: unknown | null
          unique_chatters: number | null
          video_quality_score: number | null
          viewer_interaction_score: number | null
        }
        Insert: {
          audio_quality_score?: number | null
          average_session_duration?: unknown | null
          average_viewers?: number | null
          average_watch_time?: unknown | null
          bounce_rate?: number | null
          buffer_ratio?: number | null
          chat_messages_count?: number | null
          created_at?: string | null
          dropped_frames_ratio?: number | null
          engagement_rate?: number | null
          game_performance_score?: number | null
          id?: string
          interaction_rate?: number | null
          max_concurrent_viewers?: number | null
          peak_concurrent_chatters?: number | null
          peak_viewers?: number | null
          retention_rate?: number | null
          stream_duration?: unknown | null
          stream_id?: string | null
          stream_quality_score?: number | null
          total_stream_time?: unknown | null
          unique_chatters?: number | null
          video_quality_score?: number | null
          viewer_interaction_score?: number | null
        }
        Update: {
          audio_quality_score?: number | null
          average_session_duration?: unknown | null
          average_viewers?: number | null
          average_watch_time?: unknown | null
          bounce_rate?: number | null
          buffer_ratio?: number | null
          chat_messages_count?: number | null
          created_at?: string | null
          dropped_frames_ratio?: number | null
          engagement_rate?: number | null
          game_performance_score?: number | null
          id?: string
          interaction_rate?: number | null
          max_concurrent_viewers?: number | null
          peak_concurrent_chatters?: number | null
          peak_viewers?: number | null
          retention_rate?: number | null
          stream_duration?: unknown | null
          stream_id?: string | null
          stream_quality_score?: number | null
          total_stream_time?: unknown | null
          unique_chatters?: number | null
          video_quality_score?: number | null
          viewer_interaction_score?: number | null
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
          recommendation_weight: number | null
          slug: string
          thumbnail_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          recommendation_weight?: number | null
          slug: string
          thumbnail_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          recommendation_weight?: number | null
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
      stream_challenge_participants: {
        Row: {
          challenge_id: string | null
          created_at: string | null
          id: string
          stream_id: string | null
          user_id: string | null
        }
        Insert: {
          challenge_id?: string | null
          created_at?: string | null
          id?: string
          stream_id?: string | null
          user_id?: string | null
        }
        Update: {
          challenge_id?: string | null
          created_at?: string | null
          id?: string
          stream_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "stream_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_challenge_participants_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "stream_challenge_participants_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_challenge_participants_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_challenge_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_challenges: {
        Row: {
          created_at: string | null
          current_progress: number | null
          description: string | null
          id: string
          is_active: boolean | null
          participants: string[] | null
          reward_amount: number
          reward_type: string
          stream_id: string | null
          target_value: number
          title: string
        }
        Insert: {
          created_at?: string | null
          current_progress?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          participants?: string[] | null
          reward_amount: number
          reward_type: string
          stream_id?: string | null
          target_value: number
          title: string
        }
        Update: {
          created_at?: string | null
          current_progress?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          participants?: string[] | null
          reward_amount?: number
          reward_type?: string
          stream_id?: string | null
          target_value?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_challenges_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "stream_challenges_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_challenges_stream_id_fkey"
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
      stream_dvr_segments: {
        Row: {
          cdn_edge_location: string | null
          cdn_performance_metrics: Json | null
          created_at: string | null
          id: string
          segment_duration: unknown
          segment_index: number
          segment_url: string
          storage_status: string | null
          stream_id: string | null
        }
        Insert: {
          cdn_edge_location?: string | null
          cdn_performance_metrics?: Json | null
          created_at?: string | null
          id?: string
          segment_duration: unknown
          segment_index: number
          segment_url: string
          storage_status?: string | null
          stream_id?: string | null
        }
        Update: {
          cdn_edge_location?: string | null
          cdn_performance_metrics?: Json | null
          created_at?: string | null
          id?: string
          segment_duration?: unknown
          segment_index?: number
          segment_url?: string
          storage_status?: string | null
          stream_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_dvr_segments_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "stream_dvr_segments_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_dvr_segments_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_encoding_sessions: {
        Row: {
          created_at: string
          current_settings: Json
          encoder_stats: Json
          ended_at: string | null
          error_logs: Json[] | null
          id: string
          started_at: string
          status: string
          stream_id: string
        }
        Insert: {
          created_at?: string
          current_settings: Json
          encoder_stats?: Json
          ended_at?: string | null
          error_logs?: Json[] | null
          id?: string
          started_at?: string
          status?: string
          stream_id: string
        }
        Update: {
          created_at?: string
          current_settings?: Json
          encoder_stats?: Json
          ended_at?: string | null
          error_logs?: Json[] | null
          id?: string
          started_at?: string
          status?: string
          stream_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_encoding_sessions_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "stream_encoding_sessions_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_encoding_sessions_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_game_stats: {
        Row: {
          assists: number | null
          created_at: string | null
          deaths: number | null
          game_category: string | null
          game_name: string | null
          id: string
          kills: number | null
          stream_id: string | null
          updated_at: string | null
          win_loss_ratio: number | null
        }
        Insert: {
          assists?: number | null
          created_at?: string | null
          deaths?: number | null
          game_category?: string | null
          game_name?: string | null
          id?: string
          kills?: number | null
          stream_id?: string | null
          updated_at?: string | null
          win_loss_ratio?: number | null
        }
        Update: {
          assists?: number | null
          created_at?: string | null
          deaths?: number | null
          game_category?: string | null
          game_name?: string | null
          id?: string
          kills?: number | null
          stream_id?: string | null
          updated_at?: string | null
          win_loss_ratio?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_game_stats_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "stream_game_stats_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_game_stats_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_gifts: {
        Row: {
          amount: number
          created_at: string | null
          gift_id: string
          id: string
          message: string | null
          quantity: number
          sender_id: string
          stream_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          gift_id: string
          id?: string
          message?: string | null
          quantity?: number
          sender_id: string
          stream_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          gift_id?: string
          id?: string
          message?: string | null
          quantity?: number
          sender_id?: string
          stream_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_gifts_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "virtual_gifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_gifts_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_gifts_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "stream_gifts_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_gifts_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_highlights: {
        Row: {
          clip_segments: Json[] | null
          created_at: string | null
          description: string | null
          duration: unknown
          edited_url: string | null
          editing_metadata: Json | null
          highlight_url: string | null
          id: string
          processing_status: string | null
          start_time: unknown
          stream_id: string | null
          thumbnail_url: string | null
          title: string
          user_id: string | null
          view_count: number | null
        }
        Insert: {
          clip_segments?: Json[] | null
          created_at?: string | null
          description?: string | null
          duration: unknown
          edited_url?: string | null
          editing_metadata?: Json | null
          highlight_url?: string | null
          id?: string
          processing_status?: string | null
          start_time: unknown
          stream_id?: string | null
          thumbnail_url?: string | null
          title: string
          user_id?: string | null
          view_count?: number | null
        }
        Update: {
          clip_segments?: Json[] | null
          created_at?: string | null
          description?: string | null
          duration?: unknown
          edited_url?: string | null
          editing_metadata?: Json | null
          highlight_url?: string | null
          id?: string
          processing_status?: string | null
          start_time?: unknown
          stream_id?: string | null
          thumbnail_url?: string | null
          title?: string
          user_id?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_highlights_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "stream_highlights_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_highlights_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_highlights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_interactions: {
        Row: {
          created_at: string | null
          id: string
          interaction_data: Json | null
          interaction_type: string
          stream_id: string | null
          viewer_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_data?: Json | null
          interaction_type: string
          stream_id?: string | null
          viewer_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_data?: Json | null
          interaction_type?: string
          stream_id?: string | null
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_interactions_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "stream_interactions_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_interactions_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_interactions_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_keys: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          key: string
          last_used_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          last_used_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          last_used_at?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      stream_oauth_tokens: {
        Row: {
          access_token: string
          client_id: string | null
          created_at: string | null
          expires_at: string
          id: string
          is_revoked: boolean | null
          refresh_token: string
          scope: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          client_id?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          is_revoked?: boolean | null
          refresh_token: string
          scope?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          client_id?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          is_revoked?: boolean | null
          refresh_token?: string
          scope?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stream_polls: {
        Row: {
          allow_multiple_choices: boolean | null
          created_at: string | null
          creator_id: string | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          options: Json
          question: string
          stream_id: string | null
        }
        Insert: {
          allow_multiple_choices?: boolean | null
          created_at?: string | null
          creator_id?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          options: Json
          question: string
          stream_id?: string | null
        }
        Update: {
          allow_multiple_choices?: boolean | null
          created_at?: string | null
          creator_id?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          options?: Json
          question?: string
          stream_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_polls_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_polls_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "stream_polls_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_polls_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_predictions: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          locked_at: string | null
          options: Json
          outcome: string | null
          points_pool: number | null
          resolved_at: string | null
          status: string
          stream_id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          locked_at?: string | null
          options?: Json
          outcome?: string | null
          points_pool?: number | null
          resolved_at?: string | null
          status?: string
          stream_id: string
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          locked_at?: string | null
          options?: Json
          outcome?: string | null
          points_pool?: number | null
          resolved_at?: string | null
          status?: string
          stream_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_predictions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_predictions_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "stream_predictions_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_predictions_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_preview_settings: {
        Row: {
          created_at: string | null
          id: string
          preview_delay_seconds: number | null
          preview_enabled: boolean | null
          preview_quality: Json | null
          preview_url: string | null
          stream_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          preview_delay_seconds?: number | null
          preview_enabled?: boolean | null
          preview_quality?: Json | null
          preview_url?: string | null
          stream_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          preview_delay_seconds?: number | null
          preview_enabled?: boolean | null
          preview_quality?: Json | null
          preview_url?: string | null
          stream_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_preview_settings_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "stream_preview_settings_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_preview_settings_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_protection_settings: {
        Row: {
          created_at: string
          drm_settings: Json | null
          encryption_enabled: boolean | null
          fingerprint_enabled: boolean | null
          id: string
          stream_id: string
          updated_at: string
          watermark_enabled: boolean | null
          watermark_opacity: number | null
          watermark_text: string | null
        }
        Insert: {
          created_at?: string
          drm_settings?: Json | null
          encryption_enabled?: boolean | null
          fingerprint_enabled?: boolean | null
          id?: string
          stream_id: string
          updated_at?: string
          watermark_enabled?: boolean | null
          watermark_opacity?: number | null
          watermark_text?: string | null
        }
        Update: {
          created_at?: string
          drm_settings?: Json | null
          encryption_enabled?: boolean | null
          fingerprint_enabled?: boolean | null
          id?: string
          stream_id?: string
          updated_at?: string
          watermark_enabled?: boolean | null
          watermark_opacity?: number | null
          watermark_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_protection_settings_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "stream_protection_settings_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_protection_settings_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_quality_metrics: {
        Row: {
          audio_bitrate: number | null
          audio_codec: string | null
          bandwidth_usage: number | null
          bitrate: number | null
          buffer_health: number | null
          dropped_frames: number | null
          fps: number | null
          id: string
          latency_ms: number | null
          resolution: string | null
          stream_id: string | null
          timestamp: string
          video_codec: string | null
        }
        Insert: {
          audio_bitrate?: number | null
          audio_codec?: string | null
          bandwidth_usage?: number | null
          bitrate?: number | null
          buffer_health?: number | null
          dropped_frames?: number | null
          fps?: number | null
          id?: string
          latency_ms?: number | null
          resolution?: string | null
          stream_id?: string | null
          timestamp?: string
          video_codec?: string | null
        }
        Update: {
          audio_bitrate?: number | null
          audio_codec?: string | null
          bandwidth_usage?: number | null
          bitrate?: number | null
          buffer_health?: number | null
          dropped_frames?: number | null
          fps?: number | null
          id?: string
          latency_ms?: number | null
          resolution?: string | null
          stream_id?: string | null
          timestamp?: string
          video_codec?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_quality_metrics_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "stream_quality_metrics_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_quality_metrics_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_quality_presets: {
        Row: {
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          settings: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          settings?: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          settings?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_quality_presets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_quizzes: {
        Row: {
          created_at: string | null
          creator_id: string | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          questions: Json
          show_correct_answers: boolean | null
          stream_id: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          creator_id?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          questions: Json
          show_correct_answers?: boolean | null
          stream_id?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          creator_id?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          questions?: Json
          show_correct_answers?: boolean | null
          stream_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_quizzes_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_quizzes_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "stream_quizzes_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_quizzes_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_raids: {
        Row: {
          created_at: string | null
          id: string
          raider_count: number | null
          source_stream_id: string
          target_stream_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          raider_count?: number | null
          source_stream_id: string
          target_stream_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          raider_count?: number | null
          source_stream_id?: string
          target_stream_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_raids_source_stream_id_fkey"
            columns: ["source_stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "stream_raids_source_stream_id_fkey"
            columns: ["source_stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_raids_source_stream_id_fkey"
            columns: ["source_stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_raids_target_stream_id_fkey"
            columns: ["target_stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "stream_raids_target_stream_id_fkey"
            columns: ["target_stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_raids_target_stream_id_fkey"
            columns: ["target_stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_recordings: {
        Row: {
          created_at: string | null
          download_count: number | null
          duration: unknown | null
          id: string
          recording_config: Json | null
          recording_error: string | null
          recording_status: string | null
          recording_url: string
          retention_days: number | null
          size_bytes: number | null
          status: string | null
          storage_bucket: string | null
          storage_path: string | null
          storage_status: string | null
          stream_id: string | null
          thumbnail_url: string | null
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          download_count?: number | null
          duration?: unknown | null
          id?: string
          recording_config?: Json | null
          recording_error?: string | null
          recording_status?: string | null
          recording_url: string
          retention_days?: number | null
          size_bytes?: number | null
          status?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
          storage_status?: string | null
          stream_id?: string | null
          thumbnail_url?: string | null
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          download_count?: number | null
          duration?: unknown | null
          id?: string
          recording_config?: Json | null
          recording_error?: string | null
          recording_status?: string | null
          recording_url?: string
          retention_days?: number | null
          size_bytes?: number | null
          status?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
          storage_status?: string | null
          stream_id?: string | null
          thumbnail_url?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_recordings_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "stream_recordings_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_recordings_stream_id_fkey"
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
      stream_schedule_notifications: {
        Row: {
          created_at: string | null
          id: string
          notification_type: string
          sent: boolean | null
          stream_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notification_type: string
          sent?: boolean | null
          stream_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notification_type?: string
          sent?: boolean | null
          stream_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_schedule_notifications_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "stream_schedule_notifications_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_schedule_notifications_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
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
      stream_viewer_sessions: {
        Row: {
          ended_at: string | null
          geolocation: Json | null
          id: string
          ip_address: string
          last_active_at: string
          session_token: string
          started_at: string
          stream_id: string
          suspicious_activity: boolean | null
          suspicious_flags: Json | null
          user_agent: string | null
          viewer_id: string | null
        }
        Insert: {
          ended_at?: string | null
          geolocation?: Json | null
          id?: string
          ip_address: string
          last_active_at?: string
          session_token: string
          started_at?: string
          stream_id: string
          suspicious_activity?: boolean | null
          suspicious_flags?: Json | null
          user_agent?: string | null
          viewer_id?: string | null
        }
        Update: {
          ended_at?: string | null
          geolocation?: Json | null
          id?: string
          ip_address?: string
          last_active_at?: string
          session_token?: string
          started_at?: string
          stream_id?: string
          suspicious_activity?: boolean | null
          suspicious_flags?: Json | null
          user_agent?: string | null
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_viewer_sessions_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "stream_viewer_sessions_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_viewer_sessions_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_viewer_sessions_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_violations: {
        Row: {
          action_taken: string | null
          detected_at: string
          detected_url: string | null
          detection_method: string
          evidence_data: Json
          id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          stream_id: string
          violation_type: string
        }
        Insert: {
          action_taken?: string | null
          detected_at?: string
          detected_url?: string | null
          detection_method: string
          evidence_data?: Json
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          stream_id: string
          violation_type: string
        }
        Update: {
          action_taken?: string | null
          detected_at?: string
          detected_url?: string | null
          detection_method?: string
          evidence_data?: Json
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          stream_id?: string
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_violations_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_violations_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "stream_violations_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_violations_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      streamer_comparisons: {
        Row: {
          base_streamer_id: string | null
          compared_streamer_id: string | null
          comparison_date: string | null
          id: string
          metrics: Json
          similarity_score: number | null
        }
        Insert: {
          base_streamer_id?: string | null
          compared_streamer_id?: string | null
          comparison_date?: string | null
          id?: string
          metrics: Json
          similarity_score?: number | null
        }
        Update: {
          base_streamer_id?: string | null
          compared_streamer_id?: string | null
          comparison_date?: string | null
          id?: string
          metrics?: Json
          similarity_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "streamer_comparisons_base_streamer_id_fkey"
            columns: ["base_streamer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "streamer_comparisons_compared_streamer_id_fkey"
            columns: ["compared_streamer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      streaming_config: {
        Row: {
          abr_enabled: boolean | null
          abr_settings: Json | null
          cdn_config: Json | null
          cdn_edge_rules: Json | null
          cdn_failover_endpoints: Json | null
          cdn_provider: string | null
          created_at: string
          dvr_enabled: boolean | null
          dvr_retention_days: number | null
          dvr_storage_bucket: string | null
          dvr_window_seconds: number | null
          id: string
          ingest_endpoint: string
          low_latency_mode: boolean | null
          obs_recommended_settings: Json | null
          playback_endpoint: string
          provider: string
          rtmp_server_locations: Json | null
          settings: Json | null
          stream_key_prefix: string | null
        }
        Insert: {
          abr_enabled?: boolean | null
          abr_settings?: Json | null
          cdn_config?: Json | null
          cdn_edge_rules?: Json | null
          cdn_failover_endpoints?: Json | null
          cdn_provider?: string | null
          created_at?: string
          dvr_enabled?: boolean | null
          dvr_retention_days?: number | null
          dvr_storage_bucket?: string | null
          dvr_window_seconds?: number | null
          id?: string
          ingest_endpoint: string
          low_latency_mode?: boolean | null
          obs_recommended_settings?: Json | null
          playback_endpoint: string
          provider: string
          rtmp_server_locations?: Json | null
          settings?: Json | null
          stream_key_prefix?: string | null
        }
        Update: {
          abr_enabled?: boolean | null
          abr_settings?: Json | null
          cdn_config?: Json | null
          cdn_edge_rules?: Json | null
          cdn_failover_endpoints?: Json | null
          cdn_provider?: string | null
          created_at?: string
          dvr_enabled?: boolean | null
          dvr_retention_days?: number | null
          dvr_storage_bucket?: string | null
          dvr_window_seconds?: number | null
          id?: string
          ingest_endpoint?: string
          low_latency_mode?: boolean | null
          obs_recommended_settings?: Json | null
          playback_endpoint?: string
          provider?: string
          rtmp_server_locations?: Json | null
          settings?: Json | null
          stream_key_prefix?: string | null
        }
        Relationships: []
      }
      streaming_engine_config: {
        Row: {
          created_at: string
          encoder_settings: Json
          id: string
          ingest_endpoints: Json
          quality_presets: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encoder_settings?: Json
          id?: string
          ingest_endpoints?: Json
          quality_presets?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encoder_settings?: Json
          id?: string
          ingest_endpoints?: Json
          quality_presets?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      streaming_guides: {
        Row: {
          content: string
          created_at: string | null
          guide_type: string
          id: string
          order_index: number
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          guide_type: string
          id?: string
          order_index: number
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          guide_type?: string
          id?: string
          order_index?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      streaming_platforms: {
        Row: {
          created_at: string | null
          credentials: Json | null
          id: string
          is_enabled: boolean | null
          platform_config: Json
          platform_name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          credentials?: Json | null
          id?: string
          is_enabled?: boolean | null
          platform_config?: Json
          platform_name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          credentials?: Json | null
          id?: string
          is_enabled?: boolean | null
          platform_config?: Json
          platform_name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "streaming_platforms_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      streams: {
        Row: {
          abr_active: boolean | null
          available_qualities: Json | null
          cdn_url: string | null
          chat_enabled: boolean | null
          chat_settings: Json | null
          created_at: string
          current_bitrate: number | null
          current_fps: number | null
          current_quality_preset: string | null
          description: string | null
          dvr_enabled: boolean | null
          dvr_window_seconds: number | null
          encrypted_stream_key: string | null
          ended_at: string | null
          health_status: string | null
          hls_playback_url: string | null
          id: string
          ingest_url: string | null
          is_live: boolean | null
          last_health_check: string | null
          low_latency_active: boolean | null
          max_bitrate: number | null
          oauth_token_id: string | null
          playback_url: string | null
          recommendation_score: number | null
          recurring_schedule: Json | null
          rtmp_key: string | null
          rtmp_url: string | null
          schedule_status: string | null
          scheduled_duration: unknown | null
          scheduled_start_time: string | null
          search_vector: unknown | null
          started_at: string | null
          stream_health_status: string | null
          stream_key: string | null
          stream_latency_ms: number | null
          stream_resolution: string | null
          stream_settings: Json | null
          stream_url: string | null
          streaming_url: string | null
          supported_codecs: string[] | null
          thumbnail_url: string | null
          title: string | null
          user_id: string
          viewer_count: number | null
          vod_enabled: boolean | null
          vod_processing_status: string | null
        }
        Insert: {
          abr_active?: boolean | null
          available_qualities?: Json | null
          cdn_url?: string | null
          chat_enabled?: boolean | null
          chat_settings?: Json | null
          created_at?: string
          current_bitrate?: number | null
          current_fps?: number | null
          current_quality_preset?: string | null
          description?: string | null
          dvr_enabled?: boolean | null
          dvr_window_seconds?: number | null
          encrypted_stream_key?: string | null
          ended_at?: string | null
          health_status?: string | null
          hls_playback_url?: string | null
          id?: string
          ingest_url?: string | null
          is_live?: boolean | null
          last_health_check?: string | null
          low_latency_active?: boolean | null
          max_bitrate?: number | null
          oauth_token_id?: string | null
          playback_url?: string | null
          recommendation_score?: number | null
          recurring_schedule?: Json | null
          rtmp_key?: string | null
          rtmp_url?: string | null
          schedule_status?: string | null
          scheduled_duration?: unknown | null
          scheduled_start_time?: string | null
          search_vector?: unknown | null
          started_at?: string | null
          stream_health_status?: string | null
          stream_key?: string | null
          stream_latency_ms?: number | null
          stream_resolution?: string | null
          stream_settings?: Json | null
          stream_url?: string | null
          streaming_url?: string | null
          supported_codecs?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          user_id: string
          viewer_count?: number | null
          vod_enabled?: boolean | null
          vod_processing_status?: string | null
        }
        Update: {
          abr_active?: boolean | null
          available_qualities?: Json | null
          cdn_url?: string | null
          chat_enabled?: boolean | null
          chat_settings?: Json | null
          created_at?: string
          current_bitrate?: number | null
          current_fps?: number | null
          current_quality_preset?: string | null
          description?: string | null
          dvr_enabled?: boolean | null
          dvr_window_seconds?: number | null
          encrypted_stream_key?: string | null
          ended_at?: string | null
          health_status?: string | null
          hls_playback_url?: string | null
          id?: string
          ingest_url?: string | null
          is_live?: boolean | null
          last_health_check?: string | null
          low_latency_active?: boolean | null
          max_bitrate?: number | null
          oauth_token_id?: string | null
          playback_url?: string | null
          recommendation_score?: number | null
          recurring_schedule?: Json | null
          rtmp_key?: string | null
          rtmp_url?: string | null
          schedule_status?: string | null
          scheduled_duration?: unknown | null
          scheduled_start_time?: string | null
          search_vector?: unknown | null
          started_at?: string | null
          stream_health_status?: string | null
          stream_key?: string | null
          stream_latency_ms?: number | null
          stream_resolution?: string | null
          stream_settings?: Json | null
          stream_url?: string | null
          streaming_url?: string | null
          supported_codecs?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          user_id?: string
          viewer_count?: number | null
          vod_enabled?: boolean | null
          vod_processing_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "streams_current_quality_preset_fkey"
            columns: ["current_quality_preset"]
            isOneToOne: false
            referencedRelation: "stream_quality_presets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "streams_oauth_token_id_fkey"
            columns: ["oauth_token_id"]
            isOneToOne: false
            referencedRelation: "stream_oauth_tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "streams_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
        }
        Relationships: []
      }
      subscription_tier_benefits: {
        Row: {
          benefit_description: string | null
          benefit_name: string
          benefit_type: string
          created_at: string | null
          id: string
          tier_id: string
        }
        Insert: {
          benefit_description?: string | null
          benefit_name: string
          benefit_type: string
          created_at?: string | null
          id?: string
          tier_id: string
        }
        Update: {
          benefit_description?: string | null
          benefit_name?: string
          benefit_type?: string
          created_at?: string | null
          id?: string
          tier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_tier_benefits_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_tiers: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          stripe_price_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          stripe_price_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          stripe_price_id?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          created_at: string | null
          description: string
          id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supported_languages: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_rtl: boolean | null
          name: string
          native_name: string
        }
        Insert: {
          created_at?: string | null
          id: string
          is_active?: boolean | null
          is_rtl?: boolean | null
          name: string
          native_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_rtl?: boolean | null
          name?: string
          native_name?: string
        }
        Relationships: []
      }
      tournament_brackets: {
        Row: {
          bracket_data: Json
          bracket_type: string
          created_at: string | null
          id: string
          stage_number: number
          tournament_id: string | null
          updated_at: string | null
        }
        Insert: {
          bracket_data?: Json
          bracket_type: string
          created_at?: string | null
          id?: string
          stage_number: number
          tournament_id?: string | null
          updated_at?: string | null
        }
        Update: {
          bracket_data?: Json
          bracket_type?: string
          created_at?: string | null
          id?: string
          stage_number?: number
          tournament_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_brackets_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_matches: {
        Row: {
          completed_at: string | null
          id: string
          match_number: number
          player1_id: string | null
          player2_id: string | null
          round: number
          scheduled_time: string | null
          score: Json | null
          status: string | null
          tournament_id: string | null
          winner_id: string | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          match_number: number
          player1_id?: string | null
          player2_id?: string | null
          round: number
          scheduled_time?: string | null
          score?: Json | null
          status?: string | null
          tournament_id?: string | null
          winner_id?: string | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          match_number?: number
          player1_id?: string | null
          player2_id?: string | null
          round?: number
          scheduled_time?: string | null
          score?: Json | null
          status?: string | null
          tournament_id?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_matches_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_participants: {
        Row: {
          registered_at: string | null
          seed: number | null
          status: string | null
          tournament_id: string
          user_id: string
        }
        Insert: {
          registered_at?: string | null
          seed?: number | null
          status?: string | null
          tournament_id: string
          user_id: string
        }
        Update: {
          registered_at?: string | null
          seed?: number | null
          status?: string | null
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string
          game_type: string
          id: string
          max_participants: number | null
          name: string
          prize_pool: Json | null
          rules: string[] | null
          start_date: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date: string
          game_type: string
          id?: string
          max_participants?: number | null
          name: string
          prize_pool?: Json | null
          rules?: string[] | null
          start_date: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string
          game_type?: string
          id?: string
          max_participants?: number | null
          name?: string
          prize_pool?: Json | null
          rules?: string[] | null
          start_date?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      translations: {
        Row: {
          created_at: string | null
          id: string
          key: string
          language_id: string | null
          namespace: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          language_id?: string | null
          namespace: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          language_id?: string | null
          namespace?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "translations_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "supported_languages"
            referencedColumns: ["id"]
          },
        ]
      }
      twitch_connections: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          refresh_token: string
          twitch_id: string
          twitch_login: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          refresh_token: string
          twitch_id: string
          twitch_login: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          refresh_token?: string
          twitch_id?: string
          twitch_login?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "twitch_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
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
      user_behavior_events: {
        Row: {
          component: string | null
          created_at: string | null
          event_data: Json
          event_type: string
          id: string
          page_url: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          component?: string | null
          created_at?: string | null
          event_data: Json
          event_type: string
          id?: string
          page_url?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          component?: string | null
          created_at?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          page_url?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_behavior_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          challenge_id: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          progress: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          challenge_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          progress?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          challenge_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          progress?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_data_archives: {
        Row: {
          archived_at: string | null
          archived_data: Json
          id: string
          retention_expires_at: string | null
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          archived_data: Json
          id?: string
          retention_expires_at?: string | null
          user_id: string
        }
        Update: {
          archived_at?: string | null
          archived_data?: Json
          id?: string
          retention_expires_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          category: string
          created_at: string | null
          description: string
          id: string
          status: string
          title: string
          updated_at: string | null
          user_id: string | null
          votes: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          id?: string
          status?: string
          title: string
          updated_at?: string | null
          user_id?: string | null
          votes?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
          votes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_games: {
        Row: {
          created_at: string | null
          game_id: string | null
          hours_played: number | null
          id: string
          last_played: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          game_id?: string | null
          hours_played?: number | null
          id?: string
          last_played?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          game_id?: string | null
          hours_played?: number | null
          id?: string
          last_played?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "game_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "top_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_games_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_levels: {
        Row: {
          created_at: string | null
          current_level: number | null
          current_xp: number | null
          id: string
          total_xp: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_level?: number | null
          current_xp?: number | null
          id?: string
          total_xp?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_level?: number | null
          current_xp?: number | null
          id?: string
          total_xp?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_levels_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_points: {
        Row: {
          created_at: string | null
          id: string
          points: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          points?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          points?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
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
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end: string
          current_period_start?: string
          id?: string
          plan_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      username_changes: {
        Row: {
          changed_at: string | null
          id: string
          new_username: string | null
          old_username: string | null
          user_id: string | null
        }
        Insert: {
          changed_at?: string | null
          id?: string
          new_username?: string | null
          old_username?: string | null
          user_id?: string | null
        }
        Update: {
          changed_at?: string | null
          id?: string
          new_username?: string | null
          old_username?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "username_changes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_requests: {
        Row: {
          evidence_urls: string[] | null
          id: string
          processed_at: string | null
          processed_by: string | null
          rejection_reason: string | null
          status: string
          submitted_at: string
          user_id: string
        }
        Insert: {
          evidence_urls?: string[] | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          status?: string
          submitted_at?: string
          user_id: string
        }
        Update: {
          evidence_urls?: string[] | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          status?: string
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      viewer_challenge_progress: {
        Row: {
          challenge_id: string | null
          completed_at: string | null
          created_at: string
          current_progress: number | null
          id: string
          rewards_claimed: Json | null
          user_id: string | null
        }
        Insert: {
          challenge_id?: string | null
          completed_at?: string | null
          created_at?: string
          current_progress?: number | null
          id?: string
          rewards_claimed?: Json | null
          user_id?: string | null
        }
        Update: {
          challenge_id?: string | null
          completed_at?: string | null
          created_at?: string
          current_progress?: number | null
          id?: string
          rewards_claimed?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "viewer_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "viewer_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewer_challenge_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      viewer_challenge_rewards: {
        Row: {
          challenge_id: string | null
          created_at: string
          id: string
          reward_type: string
          reward_value: Json
          tier_level: number
        }
        Insert: {
          challenge_id?: string | null
          created_at?: string
          id?: string
          reward_type: string
          reward_value?: Json
          tier_level?: number
        }
        Update: {
          challenge_id?: string | null
          created_at?: string
          id?: string
          reward_type?: string
          reward_value?: Json
          tier_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "viewer_challenge_rewards_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "viewer_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      viewer_challenges: {
        Row: {
          channel_id: string
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          reward_amount: number
          reward_type: string
          start_date: string
          title: string
          updated_at: string | null
        }
        Insert: {
          channel_id: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          reward_amount: number
          reward_type: string
          start_date: string
          title: string
          updated_at?: string | null
        }
        Update: {
          channel_id?: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          reward_amount?: number
          reward_type?: string
          start_date?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "viewer_challenges_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      viewer_engagement: {
        Row: {
          created_at: string | null
          demographic_data: Json | null
          id: string
          last_active: string | null
          messages_sent: number | null
          session_metrics: Json | null
          stream_id: string | null
          viewer_id: string | null
          watch_duration: unknown | null
        }
        Insert: {
          created_at?: string | null
          demographic_data?: Json | null
          id?: string
          last_active?: string | null
          messages_sent?: number | null
          session_metrics?: Json | null
          stream_id?: string | null
          viewer_id?: string | null
          watch_duration?: unknown | null
        }
        Update: {
          created_at?: string | null
          demographic_data?: Json | null
          id?: string
          last_active?: string | null
          messages_sent?: number | null
          session_metrics?: Json | null
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
      viewer_interaction_metrics: {
        Row: {
          created_at: string | null
          id: string
          interaction_count: number | null
          interaction_type: string
          metadata: Json | null
          session_duration: unknown | null
          stream_id: string | null
          viewer_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_count?: number | null
          interaction_type: string
          metadata?: Json | null
          session_duration?: unknown | null
          stream_id?: string | null
          viewer_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_count?: number | null
          interaction_type?: string
          metadata?: Json | null
          session_duration?: unknown | null
          stream_id?: string | null
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "viewer_interaction_metrics_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_recommendations"
            referencedColumns: ["stream_id"]
          },
          {
            foreignKeyName: "viewer_interaction_metrics_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewer_interaction_metrics_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "trending_streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewer_interaction_metrics_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_gifts: {
        Row: {
          animation_url: string | null
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          animation_url?: string | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          animation_url?: string | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      vod_chapters: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          recording_id: string
          timestamp: number
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          recording_id: string
          timestamp: number
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          recording_id?: string
          timestamp?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vod_chapters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vod_chapters_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "stream_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_multipliers: {
        Row: {
          created_at: string | null
          end_time: string | null
          id: string
          multiplier: number | null
          reason: string | null
          start_time: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          end_time?: string | null
          id?: string
          multiplier?: number | null
          reason?: string | null
          start_time?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string | null
          id?: string
          multiplier?: number | null
          reason?: string | null
          start_time?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "xp_multipliers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_season_multiplier: {
        Row: {
          current_multiplier: number | null
        }
        Relationships: []
      }
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
      top_games: {
        Row: {
          description: string | null
          id: string | null
          name: string | null
          popularity_score: number | null
          slug: string | null
          thumbnail_url: string | null
          total_posts: number | null
        }
        Relationships: []
      }
      trending_posts: {
        Row: {
          clip_votes_count: number | null
          comments_count: number | null
          content: string | null
          created_at: string | null
          id: string | null
          image_url: string | null
          likes_count: number | null
          trending_score: number | null
          user_id: string | null
          video_url: string | null
          views_count: number | null
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
          avatar_url: string | null
          description: string | null
          id: string | null
          is_live: boolean | null
          started_at: string | null
          streaming_url: string | null
          thumbnail_url: string | null
          title: string | null
          user_id: string | null
          username: string | null
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
      weekly_top_clips: {
        Row: {
          avatar_url: string | null
          content: string | null
          created_at: string | null
          image_url: string | null
          post_id: string | null
          trophy_count: number | null
          user_id: string | null
          username: string | null
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
    }
    Functions: {
      award_user_xp: {
        Args: {
          user_id_param: string
          xp_amount: number
        }
        Returns: undefined
      }
      calculate_content_predictions: {
        Args: {
          content_id_param: string
          content_type_param: string
        }
        Returns: Json
      }
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
      calculate_gaming_metrics: {
        Args: {
          stream_id_param: string
        }
        Returns: {
          kda_ratio: number
          win_rate: number
          avg_game_duration: unknown
          peak_viewers: number
          engagement_rate: number
        }[]
      }
      calculate_gaming_stream_quality: {
        Args: {
          bitrate: number
          fps: number
          dropped_frames: number
          game_type: string
        }
        Returns: number
      }
      calculate_level_from_xp: {
        Args: {
          xp: number
        }
        Returns: number
      }
      calculate_revenue_forecast: {
        Args: {
          user_id_param: string
          period_param: string
        }
        Returns: Json
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
      calculate_total_multiplier: {
        Args: {
          user_id_param: string
        }
        Returns: number
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
      calculate_viewer_retention: {
        Args: {
          stream_id_param: string
        }
        Returns: {
          retention_rate: number
          avg_session_duration: unknown
          interaction_rate: number
          bounce_rate: number
        }[]
      }
      can_change_username: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      check_auth_rate_limit: {
        Args: {
          check_ip: string
        }
        Returns: boolean
      }
      check_chat_rate_limit: {
        Args: {
          p_user_id: string
          p_stream_id: string
          p_limit?: number
          p_window_seconds?: number
        }
        Returns: boolean
      }
      check_content_against_filters: {
        Args: {
          content_text: string
        }
        Returns: {
          matched_word: string
          category: string
          severity_level: string
          action_type: string
          priority: number
          context_match: boolean
        }[]
      }
      check_rate_limit: {
        Args: {
          check_ip: string
          check_endpoint: string
          max_requests: number
          window_minutes: number
        }
        Returns: boolean
      }
      clean_expired_stories: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      clean_old_search_history: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      decrypt_stream_key: {
        Args: {
          encrypted_key: string
        }
        Returns: string
      }
      delete_user_account: {
        Args: {
          user_id_param: string
        }
        Returns: boolean
      }
      encrypt_stream_key: {
        Args: {
          key_text: string
        }
        Returns: string
      }
      filter_chat_message: {
        Args: {
          p_message: string
          p_stream_id: string
        }
        Returns: {
          filtered_message: string
          is_blocked: boolean
          filter_matched: string
        }[]
      }
      generate_stream_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_streaming_token: {
        Args: {
          user_id_param: string
        }
        Returns: Json
      }
      generate_user_stream_key: {
        Args: {
          user_id_param: string
        }
        Returns: string
      }
      get_enhanced_stream_recommendations: {
        Args: {
          user_id_param: string
        }
        Returns: {
          stream_id: string
          score: number
        }[]
      }
      get_personalized_recommendations: {
        Args: {
          user_id_param: string
        }
        Returns: {
          post_id: string
          recommendation_score: number
        }[]
      }
      get_user_data_export: {
        Args: {
          user_id_param: string
        }
        Returns: Json
      }
      get_user_trophy_stats: {
        Args: {
          user_id_param: string
        }
        Returns: {
          total_trophies: number
          weekly_trophies: number
          monthly_trophies: number
        }[]
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
      handle_failed_operation: {
        Args: {
          operation_type: string
          resource_type: string
          resource_id: string
          user_id: string
          error_message: string
          payload: Json
        }
        Returns: string
      }
      is_ip_blocked: {
        Args: {
          check_ip: string
        }
        Returns: boolean
      }
      is_user_timed_out: {
        Args: {
          p_user_id: string
          p_stream_id: string
        }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          event_type: string
          severity: string
          user_id: string
          ip_address: string
          user_agent: string
          details?: Json
        }
        Returns: string
      }
      process_chat_command: {
        Args: {
          p_message: string
          p_user_id: string
          p_stream_id: string
        }
        Returns: string
      }
      process_data_retention: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      publish_scheduled_posts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_streaming_token: {
        Args: {
          refresh_token_param: string
        }
        Returns: Json
      }
      refresh_trending_posts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_weekly_top_clips: {
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
      start_stream_with_token: {
        Args: {
          token_param: string
        }
        Returns: Json
      }
      track_post_analytics: {
        Args: {
          post_id_param: string
          metric_type: string
          increment_value?: number
        }
        Returns: undefined
      }
      update_stream_quality: {
        Args: {
          stream_id: string
          new_settings: Json
        }
        Returns: Json
      }
      update_stream_recommendation_scores: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_stream_recommendations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      validate_streaming_token: {
        Args: {
          token_param: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
