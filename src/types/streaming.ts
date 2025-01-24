export interface QualityPreset {
  resolution: string;
  bitrate: number;
  fps: number;
}

export interface StreamAnalytics {
  current_bitrate: number;
  current_fps: number;
  peak_viewers?: number;
  average_viewers?: number;
  chat_messages_count?: number;
  unique_chatters?: number;
  stream_duration?: string;
  engagement_rate?: number;
}

export interface StreamMetrics {
  bitrate: number;
  fps: number;
}