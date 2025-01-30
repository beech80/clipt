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