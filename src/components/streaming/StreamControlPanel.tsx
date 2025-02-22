
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

  const startStream = useMutation({
    mutationFn: async () => {
      console.log('Starting stream...');
      const { data, error } = await supabase.functions.invoke('mux-stream', {
        body: { action: 'create' }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stream', userId] });
      toast.success('Stream created successfully! You can now start streaming using your streaming software.');
      toast.info('Remember to copy your Stream Key and RTMP URL to your streaming software.');
    },
    onError: (error) => {
      console.error('Error creating stream:', error);
      toast.error('Failed to create stream');
    }
  });

  const endStream = useMutation({
    mutationFn: async () => {
      console.log('Ending stream...');
      const { data, error } = await supabase.functions.invoke('mux-stream', {
        body: { action: 'end' }
      });
      
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
          onClick={() => stream?.is_live ? endStream.mutate() : startStream.mutate()}
          disabled={startStream.isPending || endStream.isPending}
          size="lg"
        >
          <Radio className="mr-2 h-4 w-4" />
          {stream?.is_live ? 'End Stream' : 'Start Stream'}
        </Button>
      )}
    </div>
  );
}
