export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface AuthTypes {
  profiles: {
    Row: {
      id: string
      username: string | null
      avatar_url: string | null
      created_at: string
      bio: string | null
      website: string | null
      display_name: string | null
    }
    Insert: {
      id: string
      username?: string | null
      avatar_url?: string | null
      created_at?: string
      bio?: string | null
      website?: string | null
      display_name?: string | null
    }
    Update: {
      id?: string
      username?: string | null
      avatar_url?: string | null
      created_at?: string
      bio?: string | null
      website?: string | null
      display_name?: string | null
    }
  }
}