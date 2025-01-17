import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ChatMessage } from './chat/ChatMessage';
import { ChatInput } from './chat/ChatInput';
import { StreamChatHeader } from './chat/StreamChatHeader';
import { StreamChatError } from './chat/StreamChatError';
import { StreamChatOffline } from './chat/StreamChatOffline';
import type { StreamChatMessage } from '@/types/chat';

interface StreamChatProps {
  streamId: string;
  isLive: boolean;
  chatEnabled: boolean;
}

export const StreamChat = ({ streamId, isLive, chatEnabled }: StreamChatProps) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { data: messages, error } = useQuery({
    queryKey: ['stream-chat', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stream_chat')
        .select(`
          *,
          profiles:user_id(username, avatar_url)
        `)
        .eq('stream_id', streamId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as StreamChatMessage[];
    },
    refetchInterval: isLive ? 1000 : false,
  });

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (!chatEnabled) {
    return <StreamChatOffline />;
  }

  if (error) {
    return <StreamChatError />;
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <StreamChatHeader messageCount={messages?.length || 0} />
      
      <div 
        ref={chatContainerRef}
        className="flex-1 space-y-4 overflow-y-auto p-4"
      >
        {messages?.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>

      <ChatInput 
        onSendMessage={() => {}} 
        isDisabled={!isLive || !chatEnabled} 
      />
    </div>
  );
};