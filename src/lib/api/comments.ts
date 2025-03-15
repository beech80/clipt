import { supabase } from '@/lib/supabase';
import { CommentWithProfile } from '@/types/post';

/**
 * Create a new comment
 * @param postId ID of the post to comment on
 * @param userId ID of the user creating the comment
 * @param content Comment text content
 * @param parentId Optional parent comment ID for replies
 * @returns The newly created comment object
 */
export async function createComment(
  postId: string,
  userId: string,
  content: string,
  parentId?: string
): Promise<CommentWithProfile | null> {
  try {
    // Prepare comment data
    const commentData = {
      post_id: postId,
      user_id: userId,
      content,
      parent_id: parentId || null
    };
    
    // Insert the comment
    const { data, error } = await supabase
      .from('comments')
      .insert(commentData)
      .select(`
        *,
        profiles: profiles(*)
      `)
      .single();
      
    if (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
    
    return data as CommentWithProfile;
  } catch (error) {
    console.error('Failed to create comment:', error);
    return null;
  }
}

/**
 * Update an existing comment
 * @param commentId ID of the comment to update
 * @param content New content for the comment
 * @returns Boolean indicating success or failure
 */
export async function updateComment(
  commentId: string,
  content: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('comments')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', commentId);
      
    if (error) {
      console.error('Error updating comment:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to update comment:', error);
    return false;
  }
}

/**
 * Delete a comment
 * @param commentId ID of the comment to delete
 * @returns Boolean indicating success or failure
 */
export async function deleteComment(commentId: string): Promise<boolean> {
  try {
    // First get any child comments that need to be deleted
    const { data: childComments, error: fetchError } = await supabase
      .from('comments')
      .select('id')
      .eq('parent_id', commentId);
      
    if (fetchError) {
      console.error('Error fetching child comments:', fetchError);
    }
    
    // If there are child comments, delete them first
    if (childComments && childComments.length > 0) {
      const childIds = childComments.map(comment => comment.id);
      const { error: childDeleteError } = await supabase
        .from('comments')
        .delete()
        .in('id', childIds);
        
      if (childDeleteError) {
        console.error('Error deleting child comments:', childDeleteError);
      }
    }
    
    // Delete the comment
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);
      
    if (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to delete comment:', error);
    return false;
  }
}

/**
 * Like or unlike a comment
 * @param commentId ID of the comment to like/unlike
 * @param userId ID of the user performing the action
 * @param like True to like, false to unlike
 * @returns Boolean indicating success or failure
 */
export async function likeComment(
  commentId: string,
  userId: string,
  like: boolean
): Promise<boolean> {
  try {
    if (like) {
      // Add like
      const { error } = await supabase
        .from('comment_likes')
        .insert({ comment_id: commentId, user_id: userId });
        
      if (error) {
        // Ignore if already liked (unique constraint error)
        if (!error.message.includes('unique constraint')) {
          console.error('Error liking comment:', error);
          return false;
        }
      }
    } else {
      // Remove like
      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId);
        
      if (error) {
        console.error('Error unliking comment:', error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to toggle comment like:', error);
    return false;
  }
}
