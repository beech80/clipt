import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { StreamChatMessage } from '@/types/chat';

/** Re-read authorized rows on realtime changes; never render unchecked payloads. */
export function useStreamChatMessages(streamId: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<StreamChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let disposed = false;
    let request = 0;
    setMessages([]);
    setError(null);
    setIsLoading(true);
    if (!streamId) { setIsLoading(false); return; }
    const refresh = async () => {
      const current = ++request;
      try {
        const { data, error: chatError } = await supabase.from('stream_chat')
          .select('*').eq('stream_id', streamId).eq('is_deleted', false)
          .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(100);
        if (chatError) throw chatError;
        const ids = [...new Set(data.map(row => row.user_id).filter(Boolean))];
        const { data: profiles, error: profileError } = ids.length
          ? await supabase.from('profiles').select('id, username, avatar_url').in('id', ids)
          : { data: [], error: null };
        if (profileError) throw profileError;
        const byId = new Map(profiles.map(profile => [profile.id, profile] as const));
        if (!disposed && current === request) {
          setMessages(data.slice().reverse().map(row => ({ ...row, profiles: byId.get(row.user_id) })));
          setError(null);
        }
      } catch {
        if (!disposed && current === request) setError('Unable to load stream chat.');
      } finally {
        if (!disposed && current === request) setIsLoading(false);
      }
    };
    void refresh();
    const channel = supabase.channel(`stream-chat:${streamId}:${user?.id ?? 'guest'}:${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stream_chat', filter: `stream_id=eq.${streamId}` }, () => { void refresh(); })
      .subscribe(status => { if (status === 'SUBSCRIBED') void refresh(); });
    return () => { disposed = true; ++request; void supabase.removeChannel(channel); };
  }, [streamId, user?.id, reload]);
  return { messages, error, isLoading, refetch: () => setReload(value => value + 1) };
}
