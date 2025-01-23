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
  created_at: string;
  updated_at: string;
}