
export interface Post {
  id: string;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  user_id: string;
  created_at: string;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
    display_name?: string | null;
  } | null;
  likes_count?: number;
  clip_votes?: Array<{ count: number }>;
  comments_count?: number;
  is_published?: boolean;
  is_premium?: boolean;
  required_tier_id?: string | null;
  scheduled_publish_time?: string | null;
}
