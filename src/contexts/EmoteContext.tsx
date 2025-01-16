import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ChatEmote } from '@/types/chat';

interface EmoteContextType {
  emotes: ChatEmote[];
  addEmote: (name: string, url: string) => Promise<void>;
  removeEmote: (id: string) => Promise<void>;
}

const EmoteContext = createContext<EmoteContextType | undefined>(undefined);

export function EmoteProvider({ children }: { children: React.ReactNode }) {
  const [emotes, setEmotes] = useState<ChatEmote[]>([]);

  useEffect(() => {
    const loadEmotes = async () => {
      const { data, error } = await supabase
        .from('chat_emotes')
        .select('*')
        .order('name');

      if (!error && data) {
        setEmotes(data);
      }
    };

    loadEmotes();

    const channel = supabase
      .channel('chat_emotes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_emotes'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEmotes(prev => [...prev, payload.new as ChatEmote]);
          } else if (payload.eventType === 'DELETE') {
            setEmotes(prev => prev.filter(emote => emote.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addEmote = async (name: string, url: string) => {
    const { error } = await supabase
      .from('chat_emotes')
      .insert({ name, url });

    if (error) throw error;
  };

  const removeEmote = async (id: string) => {
    const { error } = await supabase
      .from('chat_emotes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  };

  return (
    <EmoteContext.Provider value={{ emotes, addEmote, removeEmote }}>
      {children}
    </EmoteContext.Provider>
  );
};

export const useEmotes = () => {
  const context = useContext(EmoteContext);
  if (context === undefined) {
    throw new Error('useEmotes must be used within an EmoteProvider');
  }
  return context;
};