import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface CommentData {
  post_id: string;
  user_id: string;
  content: string;
  parent_id?: string | null;
}

interface CommentResponse {
  data: any | null;
  error: Error | null;
}

export const createComment = async (commentData: CommentData): Promise<CommentResponse> => {
  try {
    console.log(`Creating comment for post ${commentData.post_id}`);
    
    // Validate inputs
    if (!commentData.post_id) {
      throw new Error("Post ID is required");
    }
    
    if (!commentData.user_id) {
      throw new Error("User ID is required");
    }
    
    if (!commentData.content.trim()) {
      throw new Error("Comment content cannot be empty");
    }

    // Insert the comment
    const { data, error } = await supabase
      .from('comments')
      .insert(commentData)
      .select(`
        id,
        content,
        created_at,
        parent_id,
        profiles:user_id (
          username,
          avatar_url
        )
      `);

    if (error) {
      console.error("Error creating comment:", error);
      throw error;
    }

    console.log("Comment created successfully:", data);
    return { data, error: null };
  } catch (error) {
    console.error("Error in createComment:", error);
    return { data: null, error: error as Error };
  }
};

export const getComments = async (postId: string, page = 0, limit = 50): Promise<CommentResponse> => {
  try {
    console.log(`Fetching comments for post: ${postId}, page: ${page}, limit: ${limit}`);
    
    if (!postId) {
      console.error("No postId provided to getComments");
      return { data: [], error: new Error("No postId provided") };
    }
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    
    // Calculate offset
    const offset = page * limit;
    
    // Fetch top-level comments
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        parent_id,
        likes_count,
        user_id,
        post_id,
        profiles:user_id (
          username,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .is('parent_id', null) // Get top-level comments only
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching comments:", error);
      throw error;
    }

    console.log(`Raw comments data for post ${postId}:`, data);

    // If we have a logged-in user, determine which comments they've liked
    let commentLikes: any[] = [];
    if (userId && data && data.length > 0) {
      const { data: likes, error: likesError } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', userId)
        .in('comment_id', data.map((comment: any) => comment.id));

      if (likesError) {
        console.error("Error fetching comment likes:", likesError);
      } else {
        commentLikes = likes || [];
      }
    }

    // Add liked_by_me property to each comment
    const commentsWithLikeStatus = data ? data.map((comment: any) => ({
      ...comment,
      liked_by_me: commentLikes.some((like: any) => like.comment_id === comment.id)
    })) : [];

    console.log(`Retrieved ${commentsWithLikeStatus?.length || 0} comments for post ${postId}`);
    return { data: commentsWithLikeStatus, error: null };
  } catch (error) {
    console.error("Error in getComments:", error);
    return { data: null, error: error as Error };
  }
};

export const getReplies = async (commentId: string): Promise<CommentResponse> => {
  try {
    console.log(`Fetching replies for comment: ${commentId}`);
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    
    // Fetch replies to the comment
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        parent_id,
        likes_count,
        user_id,
        profiles:user_id (
          username,
          avatar_url
        )
      `)
      .eq('parent_id', commentId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching replies:", error);
      throw error;
    }

    // If we have a logged-in user, determine which replies they've liked
    let replyLikes: any[] = [];
    if (userId && data.length > 0) {
      const { data: likes, error: likesError } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', userId)
        .in('comment_id', data.map((reply: any) => reply.id));

      if (likesError) {
        console.error("Error fetching reply likes:", likesError);
      } else {
        replyLikes = likes || [];
      }
    }

    // Add liked_by_me property to each reply
    const repliesWithLikeStatus = data.map((reply: any) => ({
      ...reply,
      liked_by_me: replyLikes.some((like: any) => like.comment_id === reply.id)
    }));

    console.log(`Retrieved ${repliesWithLikeStatus?.length || 0} replies for comment ${commentId}`);
    return { data: repliesWithLikeStatus, error: null };
  } catch (error) {
    console.error("Error in getReplies:", error);
    return { data: null, error: error as Error };
  }
};

export const likeComment = async (commentId: string): Promise<CommentResponse> => {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("You must be logged in to like a comment");
    }
    
    const userId = user.id;
    
    // Check if the user has already liked this comment
    const { data: existingLike, error: checkError } = await supabase
      .from('comment_likes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows returned
      console.error("Error checking existing like:", checkError);
      throw checkError;
    }
    
    let result;
    // If the user has already liked this comment, unlike it
    if (existingLike) {
      const { data, error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId);
      
      if (error) {
        console.error("Error removing like:", error);
        throw error;
      }
      
      // Update the comment like count (decrement)
      await updateCommentLikesCount(commentId);
      
      result = { liked: false };
      toast.success("Removed like from comment");
    } else {
      // Otherwise, like the comment
      const { data, error } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: commentId,
          user_id: userId
        });
      
      if (error) {
        console.error("Error adding like:", error);
        throw error;
      }
      
      // Update the comment like count (increment)
      await updateCommentLikesCount(commentId);
      
      result = { liked: true };
      toast.success("Liked comment");
    }
    
    return { data: result, error: null };
  } catch (error) {
    console.error("Error in likeComment:", error);
    toast.error("Failed to like comment");
    return { data: null, error: error as Error };
  }
};

// Helper function to update comment likes count
const updateCommentLikesCount = async (commentId: string) => {
  try {
    // Count the total likes for this comment
    const { count, error } = await supabase
      .from('comment_likes')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', commentId);
    
    if (error) {
      console.error("Error counting likes:", error);
      throw error;
    }
    
    // Update the comment with the new count
    const { data, error: updateError } = await supabase
      .from('comments')
      .update({ likes_count: count || 0 })
      .eq('id', commentId);
    
    if (updateError) {
      console.error("Error updating likes count:", updateError);
      throw updateError;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error("Error in updateCommentLikesCount:", error);
    return { data: null, error: error as Error };
  }
};

export const deleteComment = async (commentId: string, userId: string): Promise<CommentResponse> => {
  try {
    // Verify the comment belongs to the user
    const { data: comment, error: checkError } = await supabase
      .from('comments')
      .select('id')
      .eq('id', commentId)
      .eq('user_id', userId)
      .single();

    if (checkError) {
      // If not found or not authorized
      throw new Error("Comment not found or you don't have permission to delete it");
    }

    // Delete the comment
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) throw deleteError;

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error("Error in deleteComment:", error);
    return { data: null, error: error as Error };
  }
};

export const editComment = async (commentId: string, userId: string, content: string): Promise<CommentResponse> => {
  try {
    if (!content.trim()) {
      throw new Error("Comment content cannot be empty");
    }

    console.log(`Attempting to edit comment ${commentId} by user ${userId}`);

    // First check if updated_at column exists
    const { data: columnCheck, error: columnError } = await supabase
      .from('comments')
      .select('updated_at')
      .eq('id', commentId)
      .eq('user_id', userId)
      .limit(1);
    
    if (columnError) {
      console.error("Error checking updated_at column:", columnError);
      // If column doesn't exist, just update the content
      const { data: fallbackUpdate, error: fallbackError } = await supabase
        .from('comments')
        .update({ content })
        .eq('id', commentId)
        .eq('user_id', userId)
        .select('*');
      
      if (fallbackError) {
        throw fallbackError;
      }
      
      return { data: fallbackUpdate, error: null };
    }

    // If we get here, the updated_at column exists, so use it
    const { data, error: updateError } = await supabase
      .from('comments')
      .update({ 
        content, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', commentId)
      .eq('user_id', userId)
      .select(`
        id,
        content,
        created_at,
        updated_at,
        parent_id,
        likes_count,
        user_id,
        profiles:user_id (
          username,
          avatar_url
        )
      `);

    if (updateError) {
      console.error("Error updating comment:", updateError);
      throw updateError;
    }

    if (!data || data.length === 0) {
      throw new Error("Comment not found or you don't have permission to edit it");
    }

    console.log("Comment updated successfully:", data);
    return { data, error: null };
  } catch (error) {
    console.error("Error in editComment:", error);
    return { data: null, error: error as Error };
  }
};

export const getCommentCount = async (postId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (error) throw error;
    
    return count || 0;
  } catch (error) {
    console.error("Error getting comment count:", error);
    return 0;
  }
};

// New function to get all comments across posts with pagination
export const getAllComments = async (page = 0, limit = 20): Promise<CommentResponse> => {
  try {
    console.log(`Fetching all comments, page: ${page}, limit: ${limit}`);
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    
    // Calculate offset
    const offset = page * limit;
    
    // Fetch comments across all posts
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        parent_id,
        likes_count,
        user_id,
        post_id,
        profiles:user_id (
          username,
          avatar_url
        ),
        posts:post_id (
          id,
          title,
          thumbnail_url
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching all comments:", error);
      throw error;
    }

    // If we have a logged-in user, determine which comments they've liked
    let commentLikes: any[] = [];
    if (userId && data && data.length > 0) {
      const { data: likes, error: likesError } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', userId)
        .in('comment_id', data.map((comment: any) => comment.id));

      if (likesError) {
        console.error("Error fetching comment likes:", likesError);
      } else {
        commentLikes = likes || [];
      }
    }

    // Add liked_by_me property to each comment
    const commentsWithLikeStatus = data ? data.map((comment: any) => ({
      ...comment,
      liked_by_me: commentLikes.some((like: any) => like.comment_id === comment.id)
    })) : [];

    // Get total count
    const { count, error: countError } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error("Error counting total comments:", countError);
    }

    console.log(`Retrieved ${commentsWithLikeStatus?.length || 0} comments out of ${count || 'unknown'} total`);
    return { 
      data: { 
        comments: commentsWithLikeStatus,
        total: count || 0,
        page,
        limit
      }, 
      error: null 
    };
  } catch (error) {
    console.error("Error in getAllComments:", error);
    return { data: null, error: error as Error };
  }
};
