import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Smile } from 'lucide-react';

interface StreamEmotesProps {
  onSelectEmote: (emote: string) => void;
}

export const StreamEmotes = ({ onSelectEmote }: StreamEmotesProps) => {
  const { data: emotes } = useQuery({
    queryKey: ['chat-emotes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_emotes')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid grid-cols-6 gap-2 p-2">
          {emotes?.map((emote) => (
            <button
              key={emote.id}
              className="p-1 hover:bg-accent rounded"
              onClick={() => onSelectEmote(emote.name)}
            >
              <img
                src={emote.url}
                alt={emote.name}
                className="w-6 h-6"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};