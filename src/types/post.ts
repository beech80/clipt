export interface Post {
  id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
  likes_count: number;
  clip_votes: { count: number }[];
}

export interface PostHeaderProps {
  post: Post;
  commentsCount: number;
}

export interface PostActionsProps {
  post: Post;
  commentsCount: number;
  onCommentClick: () => void;
}