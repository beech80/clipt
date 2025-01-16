import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { MessageInput } from "@/components/messages/MessageInput";
import { MessageList } from "@/components/messages/MessageList";
import { Message } from "@/types/message";
import { toast } from "sonner";
import { processCommand } from "@/utils/chatCommands";
import type { StreamChatMessage } from "@/types/chat";

interface StreamChatProps {
  streamId: string;
  isLive: boolean;
}

export const StreamChat = ({ streamId, isLive }: StreamChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [timeouts, setTimeouts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!streamId) return;

    // Load existing messages
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('stream_chat')
        .select(`
          id,
          message,
          created_at,
          user_id,
          is_deleted,
          deleted_by,
          deleted_at,
          is_command,
          command_type,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('stream_id', streamId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) {
        toast.error("Failed to load chat messages");
        return;
      }

      const formattedMessages: Message[] = data.map(msg => ({
        id: msg.id,
        content: msg.message,
        sender_id: msg.user_id,
        created_at: msg.created_at,
        sender: {
          username: msg.profiles?.username || 'Unknown',
          avatar_url: msg.profiles?.avatar_url
        }
      }));

      setMessages(formattedMessages);
    };

    // Load active timeouts
    const loadTimeouts = async () => {
      const { data, error } = await supabase
        .from('chat_timeouts')
        .select('user_id, expires_at')
        .eq('stream_id', streamId)
        .gt('expires_at', new Date().toISOString());

      if (!error && data) {
        const timeoutMap: Record<string, string> = {};
        data.forEach(timeout => {
          timeoutMap[timeout.user_id] = timeout.expires_at;
        });
        setTimeouts(timeoutMap);
      }
    };

    loadMessages();
    loadTimeouts();

    // Subscribe to new messages and deletions
    const channel = supabase
      .channel('stream_chat')
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

            setMessages(prev => [...prev, newMessage]);
          } else if (payload.eventType === 'UPDATE' && payload.new.is_deleted) {
            setMessages(prev => prev.filter(msg => msg.id !== payload.new.id));
          }
        }
      )
      .subscribe();

    // Subscribe to timeout changes
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
          setTimeouts(prev => ({
            ...prev,
            [payload.new.user_id]: payload.new.expires_at
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(timeoutChannel);
    };
  }, [streamId]);

  const handleSendMessage = async (content: string) => {
    if (!user || !streamId || !isLive) return;

    // Check if user is timed out
    const userTimeout = timeouts[user.id];
    if (userTimeout && new Date(userTimeout) > new Date()) {
      const timeLeft = Math.ceil((new Date(userTimeout).getTime() - Date.now()) / 1000);
      toast.error(`You are timed out for ${timeLeft} more seconds`);
      return;
    }

    try {
      // Check if message is a command
      if (content.startsWith('/')) {
        const success = await processCommand(content, user.id, streamId);
        if (success) return;
      }

      const { error } = await supabase
        .from('stream_chat')
        .insert({
          stream_id: streamId,
          user_id: user.id,
          message: content,
          is_command: content.startsWith('/'),
          command_type: content.startsWith('/') ? content.split(' ')[0].slice(1) : null
        });

      if (error) throw error;
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg">
      <div className="p-4 border-b bg-muted">
        <h3 className="font-semibold">Stream Chat</h3>
      </div>
      <MessageList messages={messages} />
      {isLive ? (
        <MessageInput onSendMessage={handleSendMessage} />
      ) : (
        <div className="p-4 border-t text-center text-muted-foreground">
          Chat is disabled while stream is offline
        </div>
      )}
    </div>
  );
};
