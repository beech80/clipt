
import { supabase } from '@/lib/supabase';
import { Comment } from '@/components/post/comment/CommentItem';

export const getComments = async (postId: string) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (
          username,
          avatar_url,
          display_name
        ),
        likes_count:comment_likes(count)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching comments:', error);
    return { data: [], error };
  }
};

export const getCommentCount = async (postId: string) => {
  try {
    const { count, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);
    
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching comment count:', error);
    return 0;
  }
};

export const createComment = async ({ 
  content, 
  post_id, 
  user_id, 
  parent_id = null 
}: { 
  content: string; 
  post_id: string; 
  user_id: string; 
  parent_id?: string | null;
}) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          content,
          post_id,
          user_id,
          parent_id
        }
      ])
      .select(`
        *,
        profiles:user_id (
          username,
          avatar_url,
          display_name
        )
      `);
      
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating comment:', error);
    return { data: null, error };
  }
};

export const likeComment = async (commentId: string, userId: string) => {
  try {
    // Check if already liked
    const { data: existingLike } = await supabase
      .from('comment_likes')
      .select()
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId);
        
      if (error) throw error;
      return { liked: false, error: null };
    } else {
      // Like
      const { error } = await supabase
        .from('comment_likes')
        .insert([{ comment_id: commentId, user_id: userId }]);
        
      if (error) throw error;
      return { liked: true, error: null };
    }
  } catch (error) {
    console.error('Error toggling comment like:', error);
    return { liked: false, error };
  }
};

export const deleteComment = async (commentId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);
      
    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting comment:', error);
    return { success: false, error };
  }
};

export const editComment = async (commentId: string, userId: string, content: string) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .eq('user_id', userId)
      .select();
      
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error editing comment:', error);
    return { data: null, error };
  }
};
