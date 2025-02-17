
export interface ModerationAction {
  content_id: string;
  content_type: 'post' | 'comment' | 'clip';
  status: 'approved' | 'rejected' | 'pending';
  reason?: string;
}

export interface ContentModerationItem {
  id: string;
  content_id: string;
  content_type: string;
  status: string;
  moderated_by: string | null;
  moderated_at: string | null;
  reason: string | null;
  created_at: string;
  content?: {
    text?: string;
    image_url?: string;
    video_url?: string;
  };
  reporter?: {
    username: string;
    avatar_url: string;
  };
}
