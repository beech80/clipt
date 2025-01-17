import { useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ChatTimeoutsProps {
  streamId: string;
  userId?: string;
  onTimeoutChange: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const ChatTimeouts = ({ streamId, userId, onTimeoutChange }: ChatTimeoutsProps) => {
  useEffect(() => {
    if (!streamId) return;

    const timeoutChannel = supabase
      .channel('chat_timeouts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_timeouts',
          filter: `stream_id=eq.${streamId}`
        },
        (payload) => {
          onTimeoutChange((prev: Record<string, string>) => ({
            ...prev,
            [payload.new.user_id]: payload.new.expires_at
          }));
          
          if (payload.new.user_id === userId) {
            const timeLeft = Math.ceil((new Date(payload.new.expires_at).getTime() - Date.now()) / 1000);
            toast.error(`You have been timed out for ${timeLeft} seconds`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(timeoutChannel);
    };
  }, [streamId, userId, onTimeoutChange]);

  return null;
};