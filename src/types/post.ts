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
  games?: {
    id: string | number;
    name: string | null;
  } | null;
  game_id?: string | number;
  likes_count?: number;
  clip_votes?: Array<{ count: number }>;
  comments_count?: number;
  is_published?: boolean;
  is_premium?: boolean;
  required_tier_id?: string | null;
  scheduled_publish_time?: string | null;
  type?: 'video' | 'image' | 'text';
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

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  display_name?: string | null;
  bio?: string | null;
  website?: string | null;
  social_links?: Record<string, string> | null;
}

export interface Comment {
  id: string;
  content: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface PostWithProfile extends Post {
  profiles: Profile;
  comments?: CommentWithProfile[];
}

export interface CommentWithProfile extends Comment {
  profiles: Profile;
  children?: CommentWithProfile[];
  likes_count?: number;
}

export interface SearchFilters {
  type: 'all' | 'posts' | 'profiles' | 'streams';
  dateRange: 'all' | 'today' | 'week' | 'month';
  hasMedia: boolean;
  sortBy: 'recent' | 'relevant';
}
