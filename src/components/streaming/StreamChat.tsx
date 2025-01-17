import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Message } from "@/types/message";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { RealtimePresenceState } from "@supabase/supabase-js";
import { ChatHeader } from "./chat/ChatHeader";
import { ChatPresence } from "./chat/ChatPresence";
import { ChatTimeouts } from "./chat/ChatTimeouts";
import { ChatMessages } from "./chat/ChatMessages";
import { toast } from "sonner";

interface StreamChatProps {
  streamId: string;
  isLive: boolean;
}

export const StreamChat = ({ streamId, isLive }: StreamChatProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [timeouts, setTimeouts] = useState<Record<string, string>>({});
  const [activeUsers, setActiveUsers] = useState<Set<string>>(new Set());
  const [presenceState, setPresenceState] = useState<RealtimePresenceState>({});

  const { isLoading, error } = useQuery({
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

      if (error) {
        toast.error("Failed to load chat messages");
        throw error;
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
      return data;
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes (replaced cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    meta: {
      onError: (error: Error) => {
        console.error('Chat query error:', error);
        toast.error("Error loading chat messages. Retrying...");
      }
    }
  });

  // Prefetch next batch of messages
  const prefetchNextMessages = async () => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    await queryClient.prefetchQuery({
      queryKey: ['stream-chat', streamId, 'next-page'],
      queryFn: async () => {
        const { data } = await supabase
          .from('stream_chat')
          .select(`
            id,
            message,
            created_at,
            user_id,
            profiles!stream_chat_user_id_fkey (
              username,
              avatar_url
            )
          `)
          .eq('stream_id', streamId)
          .eq('is_deleted', false)
          .gt('created_at', lastMessage.created_at)
          .order('created_at', { ascending: true })
          .limit(50);
        return data;
      },
      staleTime: 10000
    });
  };

  if (error) {
    toast.error("Failed to load chat. Please refresh the page.");
  }

  return (
    <div className="flex flex-col h-[600px] border rounded-lg">
      <ChatHeader activeUsers={activeUsers} />
      
      <ChatPresence
        streamId={streamId}
        userId={user?.id}
        onPresenceChange={setPresenceState}
        onActiveUsersChange={setActiveUsers}
      />
      
      <ChatTimeouts
        streamId={streamId}
        userId={user?.id}
        onTimeoutChange={setTimeouts}
      />
      
      <ChatMessages
        streamId={streamId}
        userId={user?.id}
        isLive={isLive}
        messages={messages}
        timeouts={timeouts}
        onMessagesChange={setMessages}
      />
    </div>
  );
};