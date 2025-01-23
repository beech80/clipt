import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { StreamChatMessage } from '@/types/chat';

interface StreamChatProps {
  streamId: string;
}

const StreamChat: React.FC<StreamChatProps> = ({ streamId }) => {
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

      // Transform the data to match the StreamChatMessage type
      return data.map(message => ({
        ...message,
        profiles: message.profiles || { username: '', avatar_url: '' }
      })) as StreamChatMessage[];
    },
  });

  return (
    <div>
      {messages?.map(message => (
        <div key={message.id} className={`message ${message.is_deleted ? 'deleted' : ''}`}>
          <img src={message.profiles.avatar_url} alt={message.profiles.username} />
          <span>{message.profiles.username}: {message.message}</span>
        </div>
      ))}
    </div>
  );
};

export default StreamChat;
