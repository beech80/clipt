
import { Json } from "./database";

export interface Stream {
  id: string;
  user_id: string;
  is_live: boolean;
  viewer_count: number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  chat_enabled: boolean;
  current_bitrate: number | null;
  current_fps: number | null;
  available_qualities: Json | null;
  scheduled_start_time: string | null;
  scheduled_duration: Json | null;
  recurring_schedule: Json | null;
  vod_enabled: boolean;
  stream_settings: Json;
  max_bitrate: number;
  stream_latency_ms: number | null;
  last_health_check: string | null;
  dvr_enabled: boolean;
  dvr_window_seconds: number;
  search_vector: any | null;
  recommendation_score: number;
  abr_active: boolean;
  low_latency_active: boolean;
  current_quality_preset: string | null;
  chat_settings: Json;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  stream_key: string | null;
  stream_url: string | null;
  health_status: string;
  stream_resolution: string | null;
  schedule_status: string;
  vod_processing_status: string | null;
  ingest_url: string | null;
  playback_url: string | null;
  rtmp_url: string | null;
  rtmp_key: string | null;
  hls_playback_url: string | null;
  stream_health_status: string;
  cdn_url: string | null;
  encrypted_stream_key: string | null;
}
