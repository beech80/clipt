
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

interface StreamEmotesProps {
  streamId: string;
  onSelectEmote: (emote: string) => void;
}

export const StreamEmotes = ({ streamId, onSelectEmote }: StreamEmotesProps) => {
  const [emotes, setEmotes] = useState<ChatEmote[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const loadEmotes = async () => {
      const { data, error } = await supabase
        .from('chat_emotes')
        .select('*')
        .order('name');

      if (!error && data) {
        setEmotes(data);
        const uniqueCategories = [...new Set(data.map(emote => emote.category || 'General'))];
        setCategories(uniqueCategories);
      }
    };

    loadEmotes();
  }, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <Tabs defaultValue={categories[0]}>
          <TabsList className="w-full">
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
              className="grid grid-cols-6 gap-2"
            >
              {emotes
                .filter(emote => (emote.category || 'General') === category)
                .map(emote => (
                  <Button
                    key={emote.id}
                    variant="ghost"
                    className="h-8 w-8 p-0"
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
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};
