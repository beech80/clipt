
export interface Stream {
  id: string;
  user_id: string;
  title: string;
  stream_key: string | null;
  is_live: boolean;
  viewer_count: number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
  chat_settings?: {
    slow_mode: boolean;
    slow_mode_interval: number;
    subscriber_only: boolean;
    follower_only: boolean;
    follower_time_required: number;
    emote_only: boolean;
    auto_mod_settings: {
      enabled: boolean;
      spam_detection: boolean;
      link_protection: boolean;
      caps_limit_percent: number;
      max_emotes: number;
      blocked_terms: string[];
    };
  };
}
