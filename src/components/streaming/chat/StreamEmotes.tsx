
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Smile } from 'lucide-react';
import type { ChatEmote } from '@/types/chat';
import { parseChatEmotes } from '@/lib/chat-data';

interface StreamEmotesProps {
  streamId: string;
  onSelectEmote: (emote: string) => void;
}

export const StreamEmotes = ({ streamId, onSelectEmote }: StreamEmotesProps) => {
  const [emotes, setEmotes] = useState<ChatEmote[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const [category, setCategory] = useState('');

  useEffect(() => {
    let disposed = false;
    const loadEmotes = async () => {
      setLoading(true);
      setError(false);
      const { data, error } = await supabase
        .from('chat_emotes')
        .select('*')
        .order('name').limit(240);

      if (disposed) return;
      setLoading(false);
      setError(Boolean(error));

      if (!error && data) {
        setEmotes(parseChatEmotes(data));
        const uniqueCategories = [...new Set(data.map(emote => emote.category || 'General'))];
        setCategories(uniqueCategories);
      }
    };

    void loadEmotes().catch(() => { if (!disposed) { setError(true); setLoading(false); } });
    return () => { disposed = true; };
  }, [reload]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-11 w-11" aria-label="Choose live chat emote">
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-w-[calc(100vw-24px)]">
        {loading ? <p role="status">Loading emotes…</p> : error ? <div role="alert"><p>Emotes could not be loaded.</p><Button type="button" onClick={() => setReload(value => value + 1)}>Retry emotes</Button></div> : !emotes.length ? <p>No emotes are configured yet.</p> : <>
        <p className="text-xs text-muted-foreground mb-2">Up to 240 configured emotes.</p>
        <Tabs value={categories.includes(category) ? category : categories[0]} onValueChange={setCategory}>
          <TabsList className="w-full h-auto flex flex-wrap">
            {categories.map(category => (
              <TabsTrigger
                key={category}
                value={category}
                className="flex-1"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          {categories.map(category => (
            <TabsContent
              key={category}
              value={category}
              className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto"
            >
              {emotes
                .filter(emote => (emote.category || 'General') === category)
                .map(emote => (
                  <Button
                    key={emote.id}
                    variant="ghost"
                    type="button"
                    aria-label={`Add ${emote.name} emote`}
                    className="h-11 w-11 p-0"
                    onClick={() => onSelectEmote(emote.name)}
                  >
                    <img
                      src={emote.url}
                      alt={emote.name}
                      className="h-6 w-6"
                      loading="lazy"
                    />
                  </Button>
                ))}
            </TabsContent>
          ))}
        </Tabs></>}
      </PopoverContent>
    </Popover>
  );
};
