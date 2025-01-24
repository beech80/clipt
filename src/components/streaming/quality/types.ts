import type { Json } from '@/integrations/supabase/types';

export interface PresetData {
  id: string;
  name: string;
  description: string;
  settings: {
    video: {
      fps: number;
      bitrate: number;
      resolution: string;
    };
    audio: {
      bitrate: number;
      channels: number;
      sampleRate: number;
    };
  };
}

export interface RawPresetData {
  id: string;
  name: string;
  description: string;
  settings: Json;
  created_at: string;
  updated_at: string;
  user_id: string;
  is_default: boolean;
}