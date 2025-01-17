import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export const useNotifications = () => {
  const { user } = useAuth();

  const createNotification = useMutation({
    mutationFn: async ({
      userId,
      type,
      content,
      resourceId,
      resourceType
    }: {
      userId: string;
      type: 'follow' | 'like' | 'comment' | 'mention' | 'stream_live' | 'reply';
      content?: string;
      resourceId?: string;
      resourceType?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          actor_id: user.id,
          type,
          content,
          resource_id: resourceId,
          resource_type: resourceType,
        });

      if (error) throw error;
    },
    onError: (error) => {
      console.error('Failed to create notification:', error);
      toast.error("Failed to send notification");
    },
  });

  return {
    createNotification,
  };
};