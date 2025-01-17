export interface Post {
  id: string;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
  user_id: string;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  } | null;
  likes_count?: number;
  clip_votes?: any[];
}

export interface PostHeaderProps {
  post: Post;
  commentsCount: number;
}

export interface PostMenuProps {
  post: Post;
}

export interface PostActionsProps {
  post: Post;
  commentsCount: number;
  onCommentClick: () => void;
}

export interface SearchFilters {
  type: 'all' | 'posts' | 'profiles' | 'streams';
  dateRange: 'all' | 'today' | 'week' | 'month';
  hasMedia: boolean;
  sortBy: 'recent' | 'relevant';
}