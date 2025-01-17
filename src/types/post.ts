export interface Post {
  id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  } | null;
  likes_count?: number;
  clip_votes?: { count: number }[];
}

export interface PostHeaderProps {
  post: Post;
  commentsCount: number;
}

export interface PostMenuProps {
  postId: string;
  userId: string;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
}

export interface PostActionsProps {
  post: Post;
  commentsCount: number;
  onCommentClick: () => void;
}