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

export interface StreamGift {
  id: string;
  gift: {
    name: string;
    icon_url: string;
  };
  sender: {
    username: string;
  };
  message: string | null;
}