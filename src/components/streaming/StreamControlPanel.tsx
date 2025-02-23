
import React from 'react';
import { Button } from "@/components/ui/button";
import { Radio } from "lucide-react";
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Stream, OAuthToken } from "@/types/stream";

interface StreamControlPanelProps {
  stream: Stream | null;
  isLoading: boolean;
  userId: string;
}

export function StreamControlPanel({ stream, isLoading, userId }: StreamControlPanelProps) {
  const queryClient = useQueryClient();

  const initializeStream = useMutation({
    mutationFn: async () => {
      console.log('Initializing stream with OAuth...', userId);
      
      // Get OAuth tokens
      const { data: oauthData, error: oauthError } = await supabase.functions.invoke<OAuthToken>('oauth', {
        body: {
          action: 'token',
          grant_type: 'client_credentials',
          client_id: 'obs-client'
        }
      });

      if (oauthError || !oauthData) {
        console.error('Error getting OAuth token:', oauthError);
        throw oauthError;
      }

      // Initialize stream with the token
      const { data: streamData, error: streamError } = await supabase.functions.invoke<{ stream: Stream }>('oauth', {
        body: {
          action: 'start_stream',
          access_token: oauthData.access_token
        }
      });

      if (streamError || !streamData) {
        console.error('Error initializing stream:', streamError);
        throw streamError;
      }

      console.log('Stream initialized:', streamData);
      return streamData.stream;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stream', userId] });
      toast.success('Stream initialized successfully! You can now start streaming.');
    },
    onError: (error) => {
      console.error('Error initializing stream:', error);
      toast.error('Failed to initialize stream. Please try again.');
    }
  });

  const endStream = useMutation({
    mutationFn: async () => {
      console.log('Ending stream...');
      const { data, error } = await supabase
        .from('streams')
        .update({ 
          is_live: false,
          ended_at: new Date().toISOString(),
          streaming_url: null,
          oauth_token_id: null
        })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('Error ending stream:', error);
        throw error;
      }
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
