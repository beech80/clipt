
export interface StreamChatMessage {
  id: string;
  stream_id: string;
  user_id: string;
  message: string;
  created_at: string;
  is_deleted?: boolean;
  deleted_by?: string;
  deleted_at?: string;
  is_command?: boolean;
  command_type?: string;
  timeout_duration?: number;
  profiles?: {
    username: string;
    avatar_url: string;
  };
}

export interface ChatEmote {
  id: string;
  name: string;
  url: string;
  created_at: string;
  created_by?: string;
  category?: string;
  permissions?: {
    subscriber_only: boolean;
    moderator_only: boolean;
  };
  animated?: boolean;
}

export interface ChatCommand {
  name: string;
  execute: (args: string[], userId: string, streamId: string) => Promise<void>;
  description: string;
  moderatorOnly?: boolean;
}

export interface StreamChatProps {
  streamId: string;
  isLive: boolean;
}

export interface ChatFilter {
  id: string;
  stream_id?: string;
  pattern: string;
  filter_type: 'block' | 'replace' | 'warn';
  replacement?: string;
  is_regex: boolean;
  created_by?: string;
  created_at: string;
}

export interface FilteredMessage {
  filtered_message: string;
  is_blocked: boolean;
  filter_matched: string | null;
}

export type ChatRateLimit = {
  id: string;
  user_id: string;
  stream_id: string;
  message_count: number;
  window_start: string;
};

export type ChatTimeout = {
  id: string;
  stream_id: string;
  user_id: string;
  moderator_id: string;
  reason?: string;
  expires_at: string;
  created_at: string;
};
