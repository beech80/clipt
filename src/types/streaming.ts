
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

export interface StreamingConfig {
  ingest_endpoint: string;
  playback_endpoint: string;
  provider: string;
  settings: Record<string, any>;
  cdn_provider?: string;
  cdn_config?: Record<string, any>;
  obs_recommended_settings?: {
    video: {
      fps: number;
      preset: string;
      bitrate: {
        max: number;
        min: number;
        recommended: number;
      };
      encoder: string;
      resolution: string;
      rate_control: string;
      keyframe_interval: number;
    };
    audio: {
      bitrate: number;
      channels: number;
      sample_rate: number;
    };
  };
  rtmp_server_locations?: any[];
  stream_key_prefix?: string;
}

export interface StreamHealthStatus {
  status: 'excellent' | 'good' | 'poor' | 'critical';
  bitrate: number;
  fps: number;
  resolution?: string;
  issues?: string[];
}
