import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface FollowResponse {
  data: any | null;
  error: Error | null;
  followed?: boolean;
}

/**
 * Toggle follow status for a user
 * @param followerUserId The user ID who is following
 * @param targetUserId The user ID to follow/unfollow
 * @returns Object with success status and whether user is now following or not
 */
export const toggleFollow = async (followerUserId: string, targetUserId: string): Promise<FollowResponse> => {
  try {
    if (!followerUserId || !targetUserId) {
      throw new Error("Both follower and target user IDs are required");
    }
    
    // Don't allow users to follow themselves
    if (followerUserId === targetUserId) {
      throw new Error("You cannot follow yourself");
    }

    // Check if already following
    const { data: existingFollow, error: checkError } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', followerUserId)
      .eq('following_id', targetUserId)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') {
      // Error other than "no rows returned"
      console.error("Error checking follow status:", checkError);
      throw checkError;
    }

    if (existingFollow) {
      // Already following, so unfollow
      const { error: unfollowError } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerUserId)
        .eq('following_id', targetUserId);

      if (unfollowError) {
        console.error("Error unfollowing user:", unfollowError);
        throw unfollowError;
      }

      return { data: { success: true }, error: null, followed: false };
    } else {
      // Not following yet, so follow
      const { data: followData, error: followError } = await supabase
        .from('follows')
        .insert({ 
          follower_id: followerUserId, 
          following_id: targetUserId 
        })
        .select();

      if (followError) {
        console.error("Error following user:", followError);
        throw followError;
      }

      return { data: followData, error: null, followed: true };
    }
  } catch (error) {
    console.error("Error in toggleFollow function:", error);
    return { data: null, error: error as Error };
  }
};

/**
 * Get follower count for a user
 * @param userId User ID to get follower count for
 * @returns Number of followers
 */
export const getFollowerCount = async (userId: string): Promise<number> => {
  try {
    if (!userId) return 0;
    
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);
    
    if (error) {
      console.error("Error getting follower count:", error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error("Error in getFollowerCount:", error);
    return 0;
  }
};

/**
 * Get following count for a user
 * @param userId User ID to get following count for
 * @returns Number of users being followed
 */
export const getFollowingCount = async (userId: string): Promise<number> => {
  try {
    if (!userId) return 0;
    
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);
    
    if (error) {
      console.error("Error getting following count:", error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error("Error in getFollowingCount:", error);
    return 0;
  }
};

/**
 * Check if a user is following another user
 * @param followerUserId The user ID who might be following
 * @param targetUserId The user ID who might be followed
 * @returns Boolean indicating if following
 */
export const isFollowing = async (followerUserId: string, targetUserId: string): Promise<boolean> => {
  try {
    if (!followerUserId || !targetUserId) return false;
    
    const { data, error } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', followerUserId)
      .eq('following_id', targetUserId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error("Error checking follow status:", error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error("Error in isFollowing:", error);
    return false;
  }
};
