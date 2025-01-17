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