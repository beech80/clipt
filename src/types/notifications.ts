export type NotificationType = 'follow' | 'like' | 'comment' | 'mention' | 'stream_live' | 'reply';

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: NotificationType;
  content: string;
  resource_id?: string;
  resource_type?: string;
  read: boolean;
  created_at: string;
  actor: {
    username: string;
    avatar_url: string;
  };
}

export interface NotificationTypes {
  notifications: {
    Row: {
      id: string;
      user_id: string;
      actor_id: string;
      type: NotificationType;
      content: string;
      resource_id?: string;
      resource_type?: string;
      read: boolean;
      created_at: string;
    };
    Insert: {
      id?: string;
      user_id: string;
      actor_id: string;
      type: NotificationType;
      content: string;
      resource_id?: string;
      resource_type?: string;
      read?: boolean;
      created_at?: string;
    };
    Update: {
      id?: string;
      user_id?: string;
      actor_id?: string;
      type?: NotificationType;
      content?: string;
      resource_id?: string;
      resource_type?: string;
      read?: boolean;
      created_at?: string;
    };
  };
}