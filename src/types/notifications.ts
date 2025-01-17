export type NotificationType = 'follow' | 'like' | 'comment' | 'mention' | 'stream_live' | 'reply'

export interface NotificationTypes {
  notifications: {
    Row: {
      id: string
      user_id: string | null
      actor_id: string | null
      type: NotificationType
      content: string | null
      resource_id: string | null
      resource_type: string | null
      read: boolean | null
      created_at: string
    }
    Insert: {
      id?: string
      user_id?: string | null
      actor_id?: string | null
      type: NotificationType
      content?: string | null
      resource_id?: string | null
      resource_type?: string | null
      read?: boolean | null
      created_at?: string
    }
    Update: {
      id?: string
      user_id?: string | null
      actor_id?: string | null
      type?: NotificationType
      content?: string | null
      resource_id?: string | null
      resource_type?: string | null
      read?: boolean | null
      created_at?: string
    }
  }
}