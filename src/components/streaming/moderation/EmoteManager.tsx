
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { ChatEmote } from '@/types/chat';

interface EmoteManagerProps {
  streamId: string;
}

export const EmoteManager = ({ streamId }: EmoteManagerProps) => {
  const [emoteUrl, setEmoteUrl] = useState('');
  const [emoteName, setEmoteName] = useState('');
  const [subscriberOnly, setSubscriberOnly] = useState(false);
  const queryClient = useQueryClient();

  const { data: emotes } = useQuery({
    queryKey: ['emotes', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_emotes')
        .select('*')
        .eq('stream_id', streamId);
      
      if (error) throw error;
      return data as ChatEmote[];
    }
  });

  const addEmote = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('chat_emotes')
        .insert([{
          stream_id: streamId,
          name: emoteName,
          url: emoteUrl,
          permissions: {
            subscriber_only: subscriberOnly,
            moderator_only: false
          }
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emotes', streamId] });
      toast.success('Emote added successfully');
      setEmoteUrl('');
      setEmoteName('');
      setSubscriberOnly(false);
    },
    onError: () => {
      toast.error('Failed to add emote');
    }
  });

  const deleteEmote = useMutation({
    mutationFn: async (emoteId: string) => {
      const { error } = await supabase
        .from('chat_emotes')
        .delete()
        .eq('id', emoteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emotes', streamId] });
      toast.success('Emote removed successfully');
    },
    onError: () => {
      toast.error('Failed to remove emote');
    }
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Add New Emote</h3>
        <div className="space-y-4">
          <Input
            placeholder="Emote name (e.g., lovableHeart)"
            value={emoteName}
            onChange={(e) => setEmoteName(e.target.value)}
          />
          <Input
            placeholder="Emote URL"
            value={emoteUrl}
            onChange={(e) => setEmoteUrl(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <Switch
              checked={subscriberOnly}
              onCheckedChange={setSubscriberOnly}
            />
            <span className="text-sm">Subscriber only</span>
          </div>
          <Button onClick={() => addEmote.mutate()}>Add Emote</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Emotes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {emotes?.map((emote) => (
            <div
              key={emote.id}
              className="flex items-center justify-between p-4 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-4">
                <img
                  src={emote.url}
                  alt={emote.name}
                  className="w-8 h-8 object-contain"
                />
                <div>
                  <p className="font-medium">{emote.name}</p>
                  {emote.permissions?.subscriber_only && (
                    <p className="text-xs text-muted-foreground">Subscriber only</p>
                  )}
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteEmote.mutate(emote.id)}
              >
                Remove
              </Button>
            </div>
          ))}
          {emotes?.length === 0 && (
            <p className="text-muted-foreground text-center py-4 col-span-full">No emotes added yet</p>
          )}
        </div>
      </Card>
    </div>
  );
};
