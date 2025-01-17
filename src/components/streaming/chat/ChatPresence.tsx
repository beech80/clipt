import { useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { RealtimePresenceState } from "@/types/chat";

interface ChatPresenceProps {
  streamId: string;
  onPresenceChange?: (state: RealtimePresenceState) => void;
}

const ChatPresence = ({ streamId, onPresenceChange }: ChatPresenceProps) => {
  useEffect(() => {
    const channel = supabase.channel(`presence:${streamId}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<RealtimePresenceState>();
        onPresenceChange?.(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        toast.info(`${newPresences[0]?.username || 'Someone'} joined the chat`);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        toast.info(`${leftPresences[0]?.username || 'Someone'} left the chat`);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: supabase.auth.user()?.id,
            username: supabase.auth.user()?.user_metadata.username,
            timestamp: new Date().getTime(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [streamId, onPresenceChange]);

  return null;
};

export default ChatPresence;