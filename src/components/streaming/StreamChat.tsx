import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { MessageInput } from "@/components/messages/MessageInput";
import { MessageList } from "@/components/messages/MessageList";
import { Message } from "@/types/message";
import { toast } from "sonner";
import { processCommand } from "@/utils/chatCommands";
import type { StreamChatMessage } from "@/types/chat";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface StreamChatProps {
  streamId: string;
  isLive: boolean;
}

export const StreamChat = ({ streamId, isLive }: StreamChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [timeouts, setTimeouts] = useState<Record<string, string>>({});
  const [activeUsers, setActiveUsers] = useState<Set<string>>(new Set());

  // Fetch initial messages
  const { data: initialMessages, isLoading } = useQuery({
    queryKey: ['stream-chat', streamId],
    queryFn: async () => {
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
          profiles!stream_chat_user_id_fkey (
            username,
            avatar_url
          )
        `)
        .eq('stream_id', streamId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      return data;
    },
    enabled: !!streamId
  });

  useEffect(() => {
    if (initialMessages) {
      const formattedMessages: Message[] = initialMessages.map(msg => ({
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
    }
  }, [initialMessages]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!streamId) return;

    // Chat messages channel
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

            setMessages(prev => [...prev, newMessage]);
          } else if (payload.eventType === 'UPDATE' && payload.new.is_deleted) {
            setMessages(prev => prev.filter(msg => msg.id !== payload.new.id));
          }
        }
      )
      .subscribe();

    // Presence channel for active users
    const presenceChannel = supabase.channel(`presence_${streamId}`, {
      config: {
        presence: {
          key: user?.id,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const userIds = new Set(Object.keys(state));
        setActiveUsers(userIds);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setActiveUsers(prev => new Set([...prev, key]));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setActiveUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
      })
      .subscribe();

    // Timeout channel
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
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(timeoutChannel);
    };
  }, [streamId, user?.id]);

  const handleSendMessage = async (content: string) => {
    if (!user || !streamId || !isLive) return;

    const userTimeout = timeouts[user.id];
    if (userTimeout && new Date(userTimeout) > new Date()) {
      const timeLeft = Math.ceil((new Date(userTimeout).getTime() - Date.now()) / 1000);
      toast.error(`You are timed out for ${timeLeft} more seconds`);
      return;
    }

    try {
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
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg">
      <div className="p-4 border-b bg-muted flex items-center justify-between">
        <h3 className="font-semibold">Stream Chat</h3>
        <span className="text-sm text-muted-foreground">
          {activeUsers.size} watching
        </span>
      </div>
      
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <MessageList messages={messages} />
      )}
      
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