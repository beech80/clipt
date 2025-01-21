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
  user: {
    username: string | null;
    avatar_url: string | null;
    is_moderator?: boolean;
  } | null;
  profiles: {
    username: string;
    avatar_url: string;
    is_moderator?: boolean; // Added here since it comes from profiles table
  };
}

export interface ChatEmote {
  id: string;
  name: string;
  url: string;
  created_at: string;
  created_by?: string;
}

export interface ChatCommand {
  name: string;
  execute: (args: string[], userId: string, streamId: string) => Promise<void>;
  description: string;
  moderatorOnly?: boolean;
}

export interface StreamChatHeaderProps {
  messageCount: number;
}

export interface ChatTypes {
  stream_chat: {
    Row: StreamChatMessage;
  };
  chat_emotes: {
    Row: ChatEmote;
  };
}