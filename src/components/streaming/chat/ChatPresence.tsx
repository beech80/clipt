import { useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { RealtimePresenceState } from "@/types/chat";

interface ChatPresenceProps {
  streamId: string;
  userId?: string;
  onPresenceChange: (state: RealtimePresenceState) => void;
  onActiveUsersChange: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export const ChatPresence = ({ 
  streamId, 
  userId, 
  onPresenceChange,
  onActiveUsersChange 
}: ChatPresenceProps) => {
  useEffect(() => {
    if (!streamId || !userId) return;

    const presenceChannel = supabase.channel(`presence_${streamId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        onPresenceChange(state);
        const userIds = new Set(Object.keys(state));
        onActiveUsersChange(userIds);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        onActiveUsersChange((prev: Set<string>) => {
          const newSet = new Set(prev);
          newSet.add(key);
          return newSet;
        });
        const username = newPresences[0]?.username || 'Someone';
        toast.success(`${username} joined the chat`);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        onActiveUsersChange((prev: Set<string>) => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
        const username = leftPresences[0]?.username || 'Someone';
        toast.info(`${username} left the chat`);
      })
      .subscribe(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await presenceChannel.track({
            username: user.user_metadata.username,
            joined_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [streamId, userId, onPresenceChange, onActiveUsersChange]);

  return null;
};