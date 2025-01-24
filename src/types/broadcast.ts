export interface QualityPreset {
  fps: number;
  bitrate: number;
  resolution: string;
  keyframe_interval: number;
  audio_bitrate: number;
  audio_sample_rate: number;
}

export interface EngineConfig {
  id: string;
  user_id: string;
  quality_presets: {
    low: QualityPreset;
    medium: QualityPreset;
    high: QualityPreset;
  };
  encoder_settings: {
    audio_codec: string;
    fps_options: number[];
    video_codec: string;
    keyframe_interval: number;
    audio_bitrate_range: {
      max: number;
      min: number;
    };
    video_bitrate_range: {
      max: number;
      min: number;
    };
  };
  ingest_endpoints: any[];
  created_at: string;
  updated_at: string;
}