
import { Json } from './auth'

export interface StreamTypes {
  streams: {
    Row: {
      id: string
      user_id: string
      title: string
      description: string | null
      thumbnail_url: string | null
      stream_key: string
      is_live: boolean | null
      viewer_count: number | null
      started_at: string | null
      ended_at: string | null
      created_at: string
      stream_url: string | null
      chat_enabled: boolean | null
      health_status: string | null
      current_bitrate: number | null
      current_fps: number | null
      available_qualities: Json | null
      stream_resolution: string | null
    }
    Insert: {
      id?: string
      user_id: string
      title: string
      description?: string | null
      thumbnail_url?: string | null
      stream_key: string
      is_live?: boolean | null
      viewer_count?: number | null
      started_at?: string | null
      ended_at?: string | null
      created_at?: string
      stream_url?: string | null
      chat_enabled?: boolean | null
      health_status?: string | null
      current_bitrate?: number | null
      current_fps?: number | null
      available_qualities?: Json | null
      stream_resolution?: string | null
    }
    Update: {
      id?: string
      user_id?: string
      title?: string
      description?: string | null
      thumbnail_url?: string | null
      stream_key?: string
      is_live?: boolean | null
      viewer_count?: number | null
      started_at?: string | null
      ended_at?: string | null
      created_at?: string
      stream_url?: string | null
      chat_enabled?: boolean | null
      health_status?: string | null
      current_bitrate?: number | null
      current_fps?: number | null
      available_qualities?: Json | null
      stream_resolution?: string | null
    }
  }
}
