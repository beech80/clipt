import { Suspense, lazy, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { processCommand } from "@/utils/chatCommands";
import { StreamChatHeader } from "./chat/StreamChatHeader";
import { StreamChatError } from "./chat/StreamChatError";
import { StreamChatOffline } from "./chat/StreamChatOffline";
import { Skeleton } from "@/components/ui/skeleton";
import type { StreamChatMessage } from "@/types/chat";
import { useErrorHandler } from "@/hooks/useErrorHandler";

// Lazy load these components for better performance
const ChatMessageList = lazy(() => import("./chat/ChatMessageList"));
const ChatInput = lazy(() => import("./chat/ChatInput"));

interface StreamChatProps {
  streamId: string;
  isLive: boolean;
}

export const StreamChat = ({ streamId, isLive }: StreamChatProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  const { data: messages = [], isError } = useQuery({
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
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as StreamChatMessage[];
    },
  });

  useEffect(() => {
    if (!streamId) return;

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
        (payload) => {
          queryClient.setQueryData(['stream-chat', streamId], (old: StreamChatMessage[] = []) => {
            if (payload.eventType === 'INSERT') {
              return [...old, payload.new as StreamChatMessage];
            }
            if (payload.eventType === 'UPDATE' && payload.new.is_deleted) {
              return old.filter(msg => msg.id !== payload.new.id);
            }
            return old;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId, queryClient]);

  const handleSendMessage = async (content: string) => {
    if (!user || !streamId || !isLive) return;

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
      handleError(error, 'Failed to send message');
    }
  };

  if (isError) {
    return <StreamChatError />;
  }

  return (
    <div className="flex flex-col h-[600px] border rounded-lg">
      <StreamChatHeader />
      <Suspense fallback={<Skeleton className="flex-1" />}>
        <ChatMessageList messages={messages} />
      </Suspense>
      {isLive ? (
        <Suspense fallback={<Skeleton className="h-16 w-full" />}>
          <ChatInput onSendMessage={handleSendMessage} />
        </Suspense>
      ) : (
        <StreamChatOffline />
      )}
    </div>
  );
};