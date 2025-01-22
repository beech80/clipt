import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useErrorHandler } from './useErrorHandler';

export const useStreamChat = (streamId: string) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isChatEnabled, setIsChatEnabled] = useState(true);
  const { user } = useAuth();
  const { handleError } = useErrorHandler();

  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('stream_chat')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('stream_id', streamId)
        .order('created_at', { ascending: true })
        .throwOnError();

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      handleError(err, 'Error fetching chat messages');
      setError(err instanceof Error ? err : new Error('Failed to fetch messages'));
    } finally {
      setIsLoading(false);
    }
  }, [streamId, handleError]);

  const sendMessage = useCallback(async (content: string) => {
    if (!user) {
      toast.error('You must be logged in to chat');
      return;
    }

    try {
      const { error } = await supabase
        .from('stream_chat')
        .insert({
          stream_id: streamId,
          user_id: user.id,
          message: content,
        })
        .throwOnError();

      if (error) throw error;
      toast.success('Message sent');
    } catch (err) {
      handleError(err, 'Error sending message');
      toast.error('Failed to send message');
    }
  }, [streamId, user, handleError]);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('stream_chat')
        .update({ 
          is_deleted: true, 
          deleted_by: user?.id, 
          deleted_at: new Date().toISOString() 
        })
        .eq('id', messageId)
        .throwOnError();

      if (error) throw error;
      toast.success('Message deleted');
    } catch (err) {
      handleError(err, 'Error deleting message');
      toast.error('Failed to delete message');
    }
  }, [user, handleError]);

  useEffect(() => {
    fetchMessages();

    const subscription = supabase
      .channel(`stream_chat:${streamId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stream_chat',
        filter: `stream_id=eq.${streamId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setMessages((prev) => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id ? payload.new : msg
            )
          );
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [streamId, fetchMessages]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    deleteMessage,
    isChatEnabled,
  };
};