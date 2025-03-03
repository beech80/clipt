/**
 * Utility functions for the follow functionality
 */
import { supabase } from './supabase';
import { toast } from 'sonner';

/**
 * Create the follows table if it doesn't exist
 */
export const createFollowsTableIfNeeded = async (): Promise<boolean> => {
  try {
    console.log("Creating follows table if it doesn't exist");
    
    // First check if the table exists by trying to query it
    const { error: checkError } = await supabase
      .from('follows')
      .select('count(*)')
      .limit(1);
    
    if (!checkError) {
      console.log("Follows table exists");
      return true;
    }
    
    console.error("Error checking follows table:", checkError);
    
    // If there's an error, try to create the table using RPC
    const { error } = await supabase.rpc('create_follows_table_if_not_exists');
    
    if (error) {
      console.error("Error with RPC:", error);
      return false;
    }
    
    console.log("Follows table created successfully");
    return true;
  } catch (error) {
    console.error("Error creating follows table:", error);
    return false;
  }
};

/**
 * Toggle following a user
 */
export const followUser = async (targetUserId: string): Promise<boolean> => {
  try {
    console.log(`Attempting to follow/unfollow user: ${targetUserId}`);
    
    // Ensure we have the user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("No authenticated user found");
      toast.error("You must be logged in to follow users");
      return false;
    }
    
    // Ensure the table exists
    const tableExists = await createFollowsTableIfNeeded();
    if (!tableExists) {
      console.error("Could not ensure follows table exists");
      toast.error("System error: Could not access follows data");
      return false;
    }
    
    // Check if already following
    const { data: existingFollow, error: checkError } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .maybeSingle();
    
    if (checkError) {
      console.error("Error checking follow status:", checkError);
      toast.error("Couldn't check follow status");
      return false;
    }
    
    if (existingFollow) {
      // Already following, so unfollow
      console.log("Already following, removing follow relationship");
      const { error: unfollowError } = await supabase
        .from('follows')
        .delete()
        .match({
          follower_id: user.id,
          following_id: targetUserId
        });
        
      if (unfollowError) {
        console.error("Error unfollowing:", unfollowError);
        toast.error("Failed to unfollow user");
        return false;
      }
      
      toast.success("Unfollowed user");
      return false; // No longer following
    } else {
      // Not following, so follow
      console.log("Not following, creating follow relationship");
      const { error: followError } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: targetUserId
        });
        
      if (followError) {
        console.error("Error following user:", followError);
        toast.error("Failed to follow user");
        return false;
      }
      
      toast.success("Followed user");
      return true; // Now following
    }
  } catch (error) {
    console.error("Error in followUser:", error);
    toast.error("Something went wrong");
    return false;
  }
};
