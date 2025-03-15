import { supabase } from '@/lib/supabase';
import { PostWithProfile } from '@/types/database.types';

/**
 * Fetches a post with its comments by post ID
 * @param postId The ID of the post to fetch
 * @returns The post with profile information and comments
 */
export async function getPostWithComments(postId: string): Promise<PostWithProfile | null> {
  try {
    // First fetch the post with profile information
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select(`
        *,
        profiles: profiles(*)
      `)
      .eq('id', postId)
      .single();

    if (postError) {
      console.error('Error fetching post:', postError);
      return null;
    }

    if (!post) {
      return null;
    }

    // Then fetch all comments for this post
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select(`
        *,
        profiles: profiles(*)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      return post as PostWithProfile;
    }

    // Add comments to the post
    return {
      ...post,
      comments: comments || []
    } as PostWithProfile;
  } catch (error) {
    console.error('Error in getPostWithComments:', error);
    return null;
  }
}
