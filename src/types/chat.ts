export interface ChatTypes {
  stream_chat: {
    Row: {
      id: string
      stream_id: string | null
      user_id: string | null
      message: string
      created_at: string
      is_deleted: boolean | null
      deleted_by: string | null
      deleted_at: string | null
      is_command: boolean | null
      command_type: string | null
      timeout_duration: number | null
    }
    Insert: {
      id?: string
      stream_id?: string | null
      user_id?: string | null
      message: string
      created_at?: string
      is_deleted?: boolean | null
      deleted_by?: string | null
      deleted_at?: string | null
      is_command?: boolean | null
      command_type?: string | null
      timeout_duration?: number | null
    }
    Update: {
      id?: string
      stream_id?: string | null
      user_id?: string | null
      message?: string
      created_at?: string
      is_deleted?: boolean | null
      deleted_by?: string | null
      deleted_at?: string | null
      is_command?: boolean | null
      command_type?: string | null
      timeout_duration?: number | null
    }
  }
}