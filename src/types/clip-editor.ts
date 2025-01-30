import { Json } from "./auth";

export interface Effect {
  id: string;
  type: string;
  name?: string;
  is_premium?: boolean;
  settings: {
    value: number;
    [key: string]: any;
  };
}

export interface VideoPreviewProps {
  videoUrl: string;
  isPlaying: boolean;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
}

export interface TrimControlsProps {
  startTime: number;
  endTime: number;
  duration: number;
  onValueChange: (values: [number, number]) => void;
}

export interface EditorToolbarProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  onTrim: () => void;
}

export interface EffectsPanelProps {
  effects: Effect[];
  selectedEffects: Effect[];
  onEffectSelect: (effect: Effect) => void;
  onEffectRemove: (effectId: string) => void;
  onEffectSettingsChange: (effectId: string, settings: any) => void;
}

export interface ClipEditingSession {
  id?: string;
  user_id?: string;
  clip_id?: string;
  effects: Effect[];
  edit_history: Json[];
  status: string;
  created_at?: string;
  updated_at?: string;
}