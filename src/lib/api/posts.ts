// This is a placeholder file to fix Vercel build
// Providing minimal functionality for the CommentsPage component

export interface Post {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  media_url?: string;
  likes_count: number;
  comments_count: number;
  boost_status?: {
    type: string;
    expires_at: string;
    active: boolean;
  };
}

export const getPost = async (id: string): Promise<Post | null> => {
  console.log('Fetching post:', id);
  // Return a placeholder post with cosmic theme
  return {
    id,
    user_id: 'user-123',
    content: 'Space-themed post content',
    created_at: new Date().toISOString(),
    likes_count: 0,
    comments_count: 0,
    boost_status: {
      type: 'Chain Reaction',
      expires_at: new Date(Date.now() + 6 * 3600 * 1000).toISOString(), // 6 hours from now
      active: true
    }
  };
};

export const getPostComments = async (postId: string) => {
  console.log('Fetching comments for post:', postId);
  return [];
};

export const addComment = async (postId: string, content: string, userId: string) => {
  console.log('Adding comment to post:', postId);
  return {
    id: 'comment-' + Date.now(),
    post_id: postId,
    user_id: userId,
    content,
    created_at: new Date().toISOString()
  };
};
