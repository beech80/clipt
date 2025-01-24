export interface QualityPreset {
  fps: number;
  bitrate: number;
  resolution: string;
}

export interface BroadcastSettings {
  id: string;
  user_id: string;
  encoder_settings: {
    fps: number;
    resolution: string;
    audio_bitrate: number;
    video_bitrate: number;
  };
  output_settings: {
    platform: string;
    server_url: string;
    stream_key: string;
  };
  created_at: string;
  updated_at: string;
}

export interface EncoderPreset {
  name: string;
  settings: {
    fps: number;
    bitrate: number;
    resolution: string;
    keyframe_interval: number;
    audio_bitrate: number;
    audio_sample_rate: number;
  };
  description: string;
}