export interface SocialTypes {
  follows: {
    Row: {
      follower_id: string
      following_id: string
      created_at: string
    }
    Insert: {
      follower_id: string
      following_id: string
      created_at?: string
    }
    Update: {
      follower_id?: string
      following_id?: string
      created_at?: string
    }
  }
  likes: {
    Row: {
      id: string
      post_id: string | null
      user_id: string | null
      created_at: string
    }
    Insert: {
      id?: string
      post_id?: string | null
      user_id?: string | null
      created_at?: string
    }
    Update: {
      id?: string
      post_id?: string | null
      user_id?: string | null
      created_at?: string
    }
  }
}