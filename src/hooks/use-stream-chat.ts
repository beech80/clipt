import { useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useStreamChatMessages } from './useStreamChatMessages';

export const useStreamChat = (streamId: string) => {
  const { messages, error, isLoading } = useStreamChatMessages(streamId);
  const { user } = useAuth();
  const sending = useRef(false);

  const sendMessage = useCallback(async (content: string) => {
    if (!user) throw new Error('Sign in to send a message.');
    if (!content.trim() || content.trim().length > 2000) throw new Error('Enter between 1 and 2000 characters.');
    if (sending.current) throw new Error('Wait for your previous message to finish sending.');
    sending.current = true;
    try {
      const { data: stream, error: streamError } = await supabase.from('streams')
        .select('is_live').eq('id', streamId).single();
      if (streamError) throw streamError;
      if (!stream.is_live) throw new Error('This stream is offline.');
      const { data: limited, error: limitError } = await supabase.rpc('check_chat_rate_limit', {
        p_user_id: user.id, p_stream_id: streamId,
      });
      if (limitError) throw limitError;
      if (limited) throw new Error('You are sending messages too quickly. Try again later.');
      const { data: timedOut, error: timeoutError } = await supabase.rpc('is_user_timed_out', {
        p_user_id: user.id, p_stream_id: streamId,
      });
      if (timeoutError) throw timeoutError;
      if (timedOut) throw new Error('You are currently timed out from this chat.');
      const { data: filtered, error: filterError } = await supabase.rpc('filter_chat_message', {
        p_message: content.trim(), p_stream_id: streamId,
      });
      if (filterError) throw filterError;
      if (!filtered?.[0] || filtered[0].is_blocked) throw new Error('The chat filter did not accept this message.');
      const { data: inserted, error: sendError } = await supabase.from('stream_chat').insert({
        stream_id: streamId, user_id: user.id, message: filtered[0].filtered_message,
      }).select('id').single();
      if (sendError) throw sendError;
      if (!inserted) throw new Error('Message delivery was not confirmed.');
    } finally { sending.current = false; }
  }, [streamId, user?.id]);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!user) throw new Error('Sign in to delete your message.');
    const { data, error: deleteError } = await supabase.from('stream_chat')
      .update({ is_deleted: true, deleted_by: user.id, deleted_at: new Date().toISOString() })
      .eq('id', messageId).eq('stream_id', streamId).eq('user_id', user.id)
      .select('id').single();
    if (deleteError) throw deleteError;
    if (!data) throw new Error('Message deletion was not confirmed.');
  }, [streamId, user?.id]);

  return { messages, isLoading, error, sendMessage, deleteMessage, isChatEnabled: !!user };
};
