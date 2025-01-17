import { RealtimePresenceState as SupabasePresenceState } from "@supabase/supabase-js";

export interface ChatEmote {
  id: string;
  name: string;
  url: string;
  created_at: string;
  created_by?: string;
}

export interface ChatTimeout {
  id: string;
  stream_id: string;
  user_id: string;
  moderator_id: string;
  expires_at: string;
  created_at: string;
}

export interface ChatCommand {
  name: string;
  execute: (args: string[], userId: string, streamId: string) => Promise<void>;
  description: string;
  moderatorOnly?: boolean;
}

export interface StreamChatMessage {
  id: string;
  stream_id: string | null;
  user_id: string | null;
  message: string;
  created_at: string;
  is_deleted?: boolean;
  deleted_by?: string | null;
  deleted_at?: string | null;
  is_command?: boolean;
  command_type?: string | null;
  timeout_duration?: number | null;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  };
}

export type RealtimePresenceState = SupabasePresenceState;