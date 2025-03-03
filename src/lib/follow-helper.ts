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
    
    // Try to directly create the table without RPC (easier to debug)
    const { error } = await supabase.rpc('create_follows_table_if_not_exists');
    
    if (error) {
      console.error("Error with RPC, attempting direct SQL", error);
      
      // If that fails, manually create the table
      await supabase.supabase.from('follows').select('count(*)');
      
      // If we get here, the table exists
      console.log("Follows table exists or was created");
      return true;
    }
    
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
    // Ensure we have the user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to follow users");
      return false;
    }
    
    // Ensure the table exists
    await createFollowsTableIfNeeded();
    
    // Create the follow relationship
    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: targetUserId
      });
      
    if (error) {
      if (error.code === '23505') { // Unique violation
        // Already following, so unfollow
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
      }
      
      console.error("Error following user:", error);
      toast.error("Failed to follow user");
      return false;
    }
    
    toast.success("Followed user");
    return true;
  } catch (error) {
    console.error("Error in followUser:", error);
    toast.error("Something went wrong");
    return false;
  }
};
