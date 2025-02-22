
export interface StreamChatAutoModSettings {
  enabled: boolean;
  spam_detection: boolean;
  link_protection: boolean;
  caps_limit_percent: number;
  max_emotes: number;
  blocked_terms: string[];
}

export interface StreamChatSettings {
  slow_mode: boolean;
  slow_mode_interval: number;
  subscriber_only: boolean;
  follower_only: boolean;
  follower_time_required: number;
  emote_only: boolean;
  auto_mod_settings: StreamChatAutoModSettings;
}

export interface Stream {
  id: string;
  user_id: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  stream_key: string | null;
  rtmp_url: string | null;
  stream_url: string | null;
  playback_url: string | null;
  is_live: boolean;
  viewer_count: number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
  chat_enabled: boolean | null;
  current_bitrate: number | null;
  current_fps: number | null;
  available_qualities: any | null;
  scheduled_start_time: string | null;
  scheduled_duration: any | null; // Changed from string to any to match DB
  recurring_schedule: any | null;
  vod_enabled: boolean | null;
  stream_settings: any | null;
  max_bitrate: number | null;
  stream_latency_ms: number | null;
  last_health_check: string | null;
  dvr_enabled: boolean | null;
  dvr_window_seconds: number | null;
  search_vector: any | null;
  recommendation_score: number | null;
  abr_active: boolean | null;
  low_latency_active: boolean | null;
  current_quality_preset: string | null;
  chat_settings: StreamChatSettings | null;
  health_status: string | null;
  stream_resolution: string | null;
  schedule_status: string | null;
  vod_processing_status: string | null;
  ingest_url: string | null;
  cdn_url: string | null;
  encrypted_stream_key: string | null;
}
