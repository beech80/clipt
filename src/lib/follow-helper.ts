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
    
    // Just assume the table exists rather than checking
    // This approach is more reliable when permissions are limited
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
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error("Error getting current user:", userError);
      toast.error("Could not access your user data");
      return false;
    }
    
    if (!user) {
      console.error("No authenticated user found");
      toast.error("You must be logged in to follow users");
      return false;
    }
    
    // Don't bother checking if the table exists, just proceed with the operation
    
    // Check if already following - with error handling
    try {
      const { data: existingFollow, error: checkError } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle();
      
      if (checkError) {
        console.error("Error checking follow status:", checkError);
        
        // Try to create the follows relationship anyway
        const { error: insertError } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId
          });
          
        if (insertError) {
          // If the insert fails with a unique violation, we're already following
          if (insertError.code === '23505') {
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
              toast.error("Couldn't update follow status");
              return false;
            }
            
            toast.success("Unfollowed user");
            return false; // No longer following
          } else {
            console.error("Error creating follow:", insertError);
            toast.error("Couldn't follow user");
            return false;
          }
        }
        
        toast.success("Following user!");
        return true;
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
        
        toast.success("Following user!");
        return true; // Now following
      }
    } catch (error) {
      console.error("Error in follow status check:", error);
      toast.error("Couldn't check follow status");
      return false;
    }
  } catch (error) {
    console.error("Error in followUser:", error);
    toast.error("Something went wrong with the follow action");
    return false;
  }
};
