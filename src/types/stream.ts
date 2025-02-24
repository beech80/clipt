
export interface Stream {
  id: string;
  user_id: string;
  is_live: boolean;
  viewer_count: number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  streaming_url: string | null;
  health_status: string;
  stream_resolution: string | null;
  stream_health_status: string;
  playback_url: string | null;
  stream_key: string | null;
  oauth_token_id: string | null;
}

export interface StreamSettings {
  rtmpUrl: string;
  streamKey?: string;
}

export interface StreamHealthStatus {
  status: 'healthy' | 'warning' | 'error';
  message?: string;
}
