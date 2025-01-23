import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { StreamGift } from '@/types/chat';

interface GiftDisplayProps {
  streamId: string;
}

export function GiftDisplay({ streamId }: GiftDisplayProps) {
  const { data: gifts } = useQuery({
    queryKey: ['stream-gifts', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stream_gifts')
        .select(`
          id,
          gift:gift_id (
            name,
            icon_url
          ),
          sender:sender_id (
            username
          ),
          message
        `)
        .eq('stream_id', streamId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match the StreamGift type
      return data.map(gift => ({
        ...gift,
        gift: gift.gift?.[0] || { name: '', icon_url: '' },
        sender: gift.sender?.[0] || { username: '' }
      })) as StreamGift[];
    }
  });

  return (
    <div className="absolute bottom-4 left-4 space-y-2">
      {gifts?.map(gift => (
        <div key={gift.id} className="flex items-center space-x-2">
          <img src={gift.gift.icon_url} alt={gift.gift.name} className="w-8 h-8" />
          <div>
            <span className="font-semibold">{gift.sender.username}</span>
            <span className="text-sm"> sent a {gift.gift.name}</span>
            {gift.message && <p className="text-xs text-muted-foreground">{gift.message}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
