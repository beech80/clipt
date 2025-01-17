import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Message } from "@/types/message";
import { toast } from "sonner";

export const useChatMessages = (streamId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);

  useQuery({
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
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
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

  return { messages, setMessages };
};