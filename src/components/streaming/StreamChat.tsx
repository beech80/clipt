import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { MessageInput } from "@/components/messages/MessageInput";
import { MessageList } from "@/components/messages/MessageList";
import { Message } from "@/types/message";
import { toast } from "sonner";

interface StreamChatProps {
  streamId: string;
  isLive: boolean;
}

export const StreamChat = ({ streamId, isLive }: StreamChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);

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
          profiles (
            username,
            avatar_url
          )
        `)
        .eq('stream_id', streamId)
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

    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('stream_chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stream_chat',
          filter: `stream_id=eq.${streamId}`
        },
        async (payload) => {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', payload.new.user_id)
            .single();

          if (error) return;

          const newMessage: Message = {
            id: payload.new.id,
            content: payload.new.message,
            sender_id: payload.new.user_id,
            created_at: payload.new.created_at,
            sender: {
              username: profile.username || 'Unknown',
              avatar_url: profile.avatar_url
            }
          };

          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  const handleSendMessage = async (content: string) => {
    if (!user || !streamId || !isLive) return;

    try {
      const { error } = await supabase
        .from('stream_chat')
        .insert({
          stream_id: streamId,
          user_id: user.id,
          message: content
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