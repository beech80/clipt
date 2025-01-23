import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { StreamChatMessage } from '@/types/chat';

interface StreamChatProps {
  streamId: string;
  isLive?: boolean;
  chatEnabled?: boolean;
}

const StreamChat: React.FC<StreamChatProps> = ({ streamId, isLive = false, chatEnabled = true }) => {
  const { data: messages } = useQuery({
    queryKey: ['stream-chat', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stream_chat')
        .select(`
          id,
          stream_id,
          user_id,
          message,
          created_at,
          is_deleted,
          deleted_by,
          deleted_at,
          is_command,
          command_type,
          timeout_duration,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('stream_id', streamId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data.map(message => ({
        ...message,
        profiles: message.profiles || { username: '', avatar_url: '' }
      })) as StreamChatMessage[];
    },
  });

  if (!isLive || !chatEnabled) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Chat is currently unavailable
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {messages?.map(message => (
        <div key={message.id} className={`message ${message.is_deleted ? 'deleted' : ''}`}>
          <div className="flex items-center gap-2">
            <img 
              src={message.profiles.avatar_url} 
              alt={message.profiles.username} 
              className="w-6 h-6 rounded-full"
            />
            <span className="font-medium">{message.profiles.username}</span>
          </div>
          <p className="ml-8 text-sm">{message.message}</p>
        </div>
      ))}
    </div>
  );
};

export default StreamChat;