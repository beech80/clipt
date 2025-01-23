export interface StreamChatMessage {
  id: string;
  stream_id: string;
  user_id: string;
  message: string;
  created_at: string;
  is_deleted: boolean;
  deleted_by: string | null;
  deleted_at: string | null;
  is_command: boolean;
  command_type: string | null;
  timeout_duration: number | null;
  profiles: {
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
  description: string;
  execute: (args: string[]) => void;
}

export interface ChatTypes {
  message: StreamChatMessage;
  emote: ChatEmote;
  command: ChatCommand;
}