export interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id?: string;
  created_at: string;
  read?: boolean;
  sender?: {
    username: string | null;
    avatar_url: string | null;
  };
}

export interface ChatUser {
  id: string;
  username: string | null;
  avatar_url: string | null;
  last_message?: string;
  unread_count?: number;
}