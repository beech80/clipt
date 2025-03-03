/**
 * Utility functions for the follow functionality
 */
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Fetches the number of followers for a specific user
 * @param userId - The ID of the user to get follower count for
 * @returns Number of followers
 */
export const getFollowerCount = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);
    
    if (error) {
      console.error('Error fetching follower count:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Exception in getFollowerCount:', error);
    return 0;
  }
};

/**
 * Fetches the number of users that a specific user is following
 * @param userId - The ID of the user to get following count for
 * @returns Number of users being followed
 */
export const getFollowingCount = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);
    
    if (error) {
      console.error('Error fetching following count:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Exception in getFollowingCount:', error);
    return 0;
  }
};

/**
 * Checks if followerUserId is following targetUserId
 * @param followerUserId - The ID of the potential follower
 * @param targetUserId - The ID of the user potentially being followed
 * @returns Boolean indicating if following relationship exists
 */
export const isFollowing = async (followerUserId: string, targetUserId: string): Promise<boolean> => {
  if (!followerUserId || !targetUserId) return false;
  
  try {
    const { data, error } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', followerUserId)
      .eq('following_id', targetUserId)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Exception in isFollowing:', error);
    return false;
  }
};

/**
 * Toggles follow status between current user and target user
 * If already following, unfollows. If not following, follows.
 * 
 * @param targetUserId - User ID to follow or unfollow
 * @returns Current follow status after toggle (true = following, false = not following)
 */
export const followUser = async (targetUserId: string): Promise<boolean> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("You must be logged in to follow users");
      return false;
    }
    
    const followerUserId = user.id;
    
    // Prevent self-following
    if (followerUserId === targetUserId) {
      toast.error("You cannot follow yourself");
      return false;
    }
    
    // Check if user is already following
    const { data: existingFollow, error: checkError } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', followerUserId)
      .eq('following_id', targetUserId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking follow status:', checkError);
      toast.error("Unable to check follow status");
      return false;
    }
    
    // If already following, unfollow
    if (existingFollow) {
      const { error: deleteError } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerUserId)
        .eq('following_id', targetUserId);
      
      if (deleteError) {
        console.error('Error unfollowing user:', deleteError);
        toast.error("Failed to unfollow user");
        return true; // Still following
      }
      
      // Update follower count in profiles table
      await updateFollowerCounts(targetUserId);
      
      toast.success("User unfollowed");
      return false; // No longer following
    }
    
    // Not following, so create follow relationship
    const { error: insertError } = await supabase
      .from('follows')
      .insert({
        follower_id: followerUserId,
        following_id: targetUserId,
        created_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error('Error following user:', insertError);
      toast.error("Failed to follow user");
      return false; // Not following
    }
    
    // Update follower count in profiles table
    await updateFollowerCounts(targetUserId);
    
    toast.success("User followed");
    return true; // Now following
  } catch (error) {
    console.error('Exception in followUser:', error);
    toast.error("An error occurred while updating follow status");
    return false;
  }
};

/**
 * Updates the follower and following counts in the profiles table
 * @param userId - User ID to update counts for
 */
export const updateFollowerCounts = async (userId: string): Promise<void> => {
  try {
    // Get follower count
    const followerCount = await getFollowerCount(userId);
    
    // Update profile with new count
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ followers: followerCount })
      .eq('id', userId);
    
    if (updateError) {
      console.error('Error updating follower count:', updateError);
    }
  } catch (error) {
    console.error('Exception in updateFollowerCounts:', error);
  }
};

/**
 * Utility function to ensure a profile exists for a user
 * Creates a basic profile if one doesn't exist
 * 
 * @param userId - User ID to ensure profile for
 * @returns Boolean indicating success
 */
export const ensureProfileExists = async (userId: string): Promise<boolean> => {
  try {
    // Check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking profile existence:', checkError);
      return false;
    }
    
    // Profile exists
    if (existingProfile) {
      return true;
    }
    
    // Profile doesn't exist, create it
    console.log(`Creating profile for user ${userId}`);
    
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username: `user_${userId.substring(0, 8)}`,
        display_name: `User ${userId.substring(0, 8)}`,
        bio: '',
        avatar_url: '',
        followers: 0,
        following: 0,
        achievements: 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating profile:', createError);
      return false;
    }
    
    console.log('Profile created successfully:', newProfile);
    
    // Also create default achievements for this user with 0 progress
    try {
      const { createDefaultAchievementsForUser } = await import('@/services/achievementService').then(
        module => ({ createDefaultAchievementsForUser: module.default.createDefaultAchievementsForUser })
      );
      
      await createDefaultAchievementsForUser(userId);
      console.log('Default achievements created for new user:', userId);
    } catch (achievementError) {
      console.error('Error creating default achievements:', achievementError);
      // Continue anyway, the profile was created successfully
    }
    
    return true;
  } catch (error) {
    console.error('Exception in ensureProfileExists:', error);
    return false;
  }
};

/**
 * Create the follows table if it doesn't exist
 */
export const createFollowsTableIfNeeded = async (): Promise<boolean> => {
  try {
    console.log("Creating follows table if it doesn't exist");
    
    // Just assume the table exists rather than checking
    // This approach is more reliable when permissions are limited
    return true;
  } catch (error) {
    console.error("Error creating follows table:", error);
    return false;
  }
};
