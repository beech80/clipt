import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function useBlockUser() {
  const [isBlocking, setIsBlocking] = useState(false);

  const blockUser = async (userIdToBlock: string) => {
    try {
      setIsBlocking(true);
      const { error } = await supabase
        .from('user_blocks')
        .insert({
          blocker_id: (await supabase.auth.getUser()).data.user?.id,
          blocked_id: userIdToBlock
        });

      if (error) throw error;
      toast.success("User blocked successfully");
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error("Failed to block user");
    } finally {
      setIsBlocking(false);
    }
  };

  const unblockUser = async (userIdToUnblock: string) => {
    try {
      setIsBlocking(true);
      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .match({ 
          blocker_id: (await supabase.auth.getUser()).data.user?.id,
          blocked_id: userIdToUnblock 
        });

      if (error) throw error;
      toast.success("User unblocked successfully");
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error("Failed to unblock user");
    } finally {
      setIsBlocking(false);
    }
  };

  const checkIfBlocked = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_blocks')
        .select('*')
        .match({ 
          blocker_id: (await supabase.auth.getUser()).data.user?.id,
          blocked_id: userId 
        })
        .single();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking block status:', error);
      return false;
    }
  };

  return {
    blockUser,
    unblockUser,
    checkIfBlocked,
    isBlocking
  };
}