export interface QualityPreset {
  fps: number;
  bitrate: number;
  resolution: string;
  keyframe_interval: number;
  audio_bitrate: number;
  audio_sample_rate: number;
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

export interface SceneSource {
  id: string;
  scene_id: string;
  name: string;
  type: string;
  settings: Record<string, unknown>;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
    z_index: number;
  };
}

export interface EngineConfig {
  id: string;
  user_id: string;
  quality_presets: Record<string, QualityPreset>;
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