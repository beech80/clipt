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
    
    // Calculate offset
    const offset = page * limit;
    
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
      .eq('post_id', postId)
      .is('parent_id', null) // Get top-level comments only
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching comments:", error);
      throw error;
    }

    console.log(`Retrieved ${data?.length || 0} comments for post ${postId}`);
    return { data, error: null };
  } catch (error) {
    console.error("Error in getComments:", error);
    return { data: null, error: error as Error };
  }
};

export const getReplies = async (commentId: string): Promise<CommentResponse> => {
  try {
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

    return { data, error: null };
  } catch (error) {
    console.error("Error in getReplies:", error);
    return { data: null, error: error as Error };
  }
};

export const likeComment = async (commentId: string, userId: string): Promise<CommentResponse> => {
  try {
    // First check if the user has already liked this comment
    const { data: existingLike, error: checkError } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error("Error checking existing like:", checkError);
      throw checkError;
    }

    if (existingLike) {
      // User already liked this comment, so unlike it
      console.log("Removing existing like");
      const { error: deleteError } = await supabase
        .from('comment_likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) {
        console.error("Error removing like:", deleteError);
        throw deleteError;
      }

      return { data: { liked: false }, error: null };
    } else {
      // Add new like
      console.log("Adding new like");
      const { data: newLike, error: insertError } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: commentId,
          user_id: userId
        })
        .select('id')
        .single();

      if (insertError) {
        console.error("Error adding like:", insertError);
        throw insertError;
      }

      return { data: { liked: true }, error: null };
    }
  } catch (error) {
    console.error("Error liking/unliking comment:", error);
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
