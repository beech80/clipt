import { useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { Message } from "@/types/message";
import { MessageList } from "@/components/messages/MessageList";
import { MessageInput } from "@/components/messages/MessageInput";
import { toast } from "sonner";
import { processCommand } from "@/utils/chatCommands";
import { Loader2 } from "lucide-react";

interface ChatMessagesProps {
  streamId: string;
  userId?: string;
  isLive: boolean;
  messages: Message[];
  timeouts: Record<string, string>;
  onMessagesChange: React.Dispatch<React.SetStateAction<Message[]>>;
}

export const ChatMessages = ({
  streamId,
  userId,
  isLive,
  messages,
  timeouts,
  onMessagesChange,
}: ChatMessagesProps) => {
  useEffect(() => {
    if (!streamId) return;

    const chatChannel = supabase
      .channel(`stream_chat:${streamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stream_chat',
          filter: `stream_id=eq.${streamId}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, avatar_url')
              .eq('id', payload.new.user_id)
              .single();

            const newMessage: Message = {
              id: payload.new.id,
              content: payload.new.message,
              sender_id: payload.new.user_id,
              created_at: payload.new.created_at,
              sender: {
                username: profile?.username || 'Unknown',
                avatar_url: profile?.avatar_url
              }
            };

            onMessagesChange((prev: Message[]) => [...prev, newMessage]);
          } else if (payload.eventType === 'UPDATE' && payload.new.is_deleted) {
            onMessagesChange((prev: Message[]) => prev.filter(msg => msg.id !== payload.new.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
    };
  }, [streamId, onMessagesChange]);

  const handleSendMessage = async (content: string) => {
    if (!userId || !streamId || !isLive) return;

    const userTimeout = timeouts[userId];
    if (userTimeout && new Date(userTimeout) > new Date()) {
      const timeLeft = Math.ceil((new Date(userTimeout).getTime() - Date.now()) / 1000);
      toast.error(`You are timed out for ${timeLeft} more seconds`);
      return;
    }

    try {
      if (content.startsWith('/')) {
        const success = await processCommand(content, userId, streamId);
        if (success) return;
      }

      const { error } = await supabase
        .from('stream_chat')
        .insert({
          stream_id: streamId,
          user_id: userId,
          message: content,
          is_command: content.startsWith('/'),
          command_type: content.startsWith('/') ? content.split(' ')[0].slice(1) : null
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    }
  };

  if (!messages) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <MessageList messages={messages} />
      {isLive ? (
        <MessageInput onSendMessage={handleSendMessage} />
      ) : (
        <div className="p-4 border-t text-center text-muted-foreground">
          Chat is disabled while stream is offline
        </div>
      )}
    </>
  );
};
