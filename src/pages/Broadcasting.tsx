
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BroadcastPresetForm } from "@/components/broadcasting/BroadcastPresetForm";
import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import GameBoyControls from "@/components/GameBoyControls";
import { OBSSetupGuide } from "@/components/streaming/setup/OBSSetupGuide";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Copy, Radio, StopCircle } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { StreamPlayer } from "@/components/streaming/StreamPlayer";
import type { Stream } from "@/types/stream";

const Broadcasting = () => {
  const { user } = useAuth();
  const [showKey, setShowKey] = useState(false);
  const queryClient = useQueryClient();

  const { data: stream, isLoading: isLoadingStream } = useQuery<Stream | null>({
    queryKey: ['stream', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_live', true)
        .maybeSingle();
      
      if (error) throw error;
      
      // Ensure we have all required fields with proper types
      if (data) {
        return {
          ...data,
          updated_at: data.updated_at || new Date().toISOString(),
          created_at: data.created_at || new Date().toISOString(),
          viewer_count: data.viewer_count || 0,
          is_live: !!data.is_live
        } as Stream;
      }
      return null;
    },
    enabled: !!user?.id
  });

  const createStreamMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('mux-stream', {
        body: { action: 'create' }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stream'] });
      toast.success('Stream created successfully');
    },
    onError: (error) => {
      console.error('Error creating stream:', error);
      toast.error('Failed to create stream');
    }
  });

  const endStreamMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('mux-stream', {
        body: { action: 'end' }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stream'] });
      toast.success('Stream ended successfully');
    },
    onError: (error) => {
      console.error('Error ending stream:', error);
      toast.error('Failed to end stream');
    }
  });

  const copyToClipboard = (text: string | null, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text)
      .then(() => toast.success(`${label} copied to clipboard`))
      .catch(() => toast.error(`Failed to copy ${label}`));
  };

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Please Login</h2>
          <p className="text-muted-foreground">
            You need to be logged in to access broadcasting features.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6 pb-40">
      <div className="flex items-center gap-4">
        <BackButton />
        <h1 className="text-2xl font-bold">Broadcasting Studio</h1>
      </div>

      {stream && (
        <StreamPlayer
          streamId={stream.id}
          title={stream.title}
          isLive={stream.is_live}
          viewerCount={stream.viewer_count}
          playbackUrl={stream.playback_url}
        />
      )}

      {/* Stream Control */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Stream Control</h3>
            <div className="flex gap-2">
              {!stream ? (
                <Button
                  onClick={() => createStreamMutation.mutate()}
                  disabled={createStreamMutation.isPending}
                >
                  <Radio className="h-4 w-4 mr-2" />
                  Start New Stream
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={() => endStreamMutation.mutate()}
                  disabled={endStreamMutation.isPending}
                >
                  <StopCircle className="h-4 w-4 mr-2" />
                  End Stream
                </Button>
              )}
            </div>
          </div>

          {stream && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={stream.stream_key || 'No stream key found'}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(stream.stream_key, 'Stream key')}
                  disabled={!stream.stream_key}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Stream URL</h4>
                <div className="flex gap-2">
                  <Input
                    value={stream.stream_url || 'No stream URL found'}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(stream.stream_url, 'Stream URL')}
                    disabled={!stream.stream_url}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Keep your stream key private. If compromised, end the stream and create a new one.
          </p>
        </div>
      </Card>

      <OBSSetupGuide />
      
      <BroadcastPresetForm userId={user.id} />
      
      <GameBoyControls />
    </div>
  );
}

export default Broadcasting;
