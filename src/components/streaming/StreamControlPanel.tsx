
import React from 'react';
import { Button } from "@/components/ui/button";
import { Radio } from "lucide-react";
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Stream } from "@/types/stream";

interface StreamControlPanelProps {
  stream: Stream | null;
  isLoading: boolean;
  userId: string;
}

export function StreamControlPanel({ stream, isLoading, userId }: StreamControlPanelProps) {
  const queryClient = useQueryClient();

  const initializeStream = useMutation({
    mutationFn: async () => {
      console.log('Initializing stream...');
      const { data, error } = await supabase
        .from('streams')
        .insert([
          { 
            user_id: userId,
            rtmp_url: 'rtmp://stream.lovable.dev/live',
            stream_key: crypto.randomUUID().replace(/-/g, ''),
            health_status: 'offline',
            stream_health_status: 'offline'
          }
        ])
        .select()
        .single();
      
      if (error) {
        console.error('Error initializing stream:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stream', userId] });
      toast.success('Stream initialized successfully! You can now start streaming.');
    },
    onError: (error) => {
      console.error('Error initializing stream:', error);
      toast.error('Failed to initialize stream');
    }
  });

  const endStream = useMutation({
    mutationFn: async () => {
      console.log('Ending stream...');
      const { data, error } = await supabase
        .from('streams')
        .update({ 
          is_live: false,
          ended_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stream', userId] });
      toast.success('Stream ended successfully');
    },
    onError: (error) => {
      console.error('Error ending stream:', error);
      toast.error('Failed to end stream');
    }
  });

  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold">Stream Controls</h2>
      {!isLoading && (
        <Button
          variant={stream?.is_live ? "destructive" : "default"}
          onClick={() => stream?.is_live ? endStream.mutate() : initializeStream.mutate()}
          disabled={initializeStream.isPending || endStream.isPending}
          size="lg"
        >
          <Radio className="mr-2 h-4 w-4" />
          {stream?.is_live ? 'End Stream' : 'Initialize Stream'}
        </Button>
      )}
    </div>
  );
}
