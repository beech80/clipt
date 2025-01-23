export interface Post {
  id: string;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  user_id: string;
  created_at: string;
  likes_count?: number;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
    display_name?: string | null;
  };
  clip_votes?: Array<{ count: number }>;
  is_published?: boolean;
  is_premium?: boolean;
  required_tier_id?: string | null;
  scheduled_publish_time?: string | null;
}

export interface PostHeaderProps {
  post: Post;
  commentsCount: number;
}

export interface PostMenuProps {
  postId: string;
  userId: string;
  content: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
}

export interface PostActionsProps {
  post: Post;
  commentsCount: number;
  onCommentClick: () => void;
}