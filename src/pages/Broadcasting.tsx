import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BroadcastPresetForm } from "@/components/broadcasting/BroadcastPresetForm";
import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import GameBoyControls from "@/components/GameBoyControls";
import { OBSSetupGuide } from "@/components/streaming/setup/OBSSetupGuide";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Copy, Radio, StopCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { StreamPlayer } from "@/components/streaming/StreamPlayer";
import type { Stream } from "@/types/stream";

const Broadcasting = () => {
  const { user } = useAuth();
  const [showToken, setShowToken] = useState(false);
  const [showStreamKey, setShowStreamKey] = useState(false);
  const queryClient = useQueryClient();

  // Query for stream key
  const { data: streamKey, isLoading: isLoadingStreamKey } = useQuery({
    queryKey: ['streamKey', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      console.log('Fetching stream key...');
      const { data, error } = await supabase
        .from('stream_keys')
        .select('stream_key')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error loading stream key:', error);
        return null;
      }

      return data?.stream_key;
    },
    enabled: !!user?.id
  });

  // Generate new stream key mutation
  const generateStreamKey = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      console.log('Generating new stream key...');
      const { data, error } = await supabase
        .rpc('generate_stream_key', {
          user_id_param: user.id
        });
      
      if (error) {
        console.error('Error generating stream key:', error);
        throw error;
      }
      
      return data;
    },
    onError: (error) => {
      console.error('Failed to generate stream key:', error);
      toast.error('Failed to generate stream key. Please try again.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streamKey'] });
      toast.success('Stream key generated successfully!');
    }
  });

  // Query for stream data
  const { data: stream, isLoading } = useQuery<Stream | null>({
    queryKey: ['stream', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      console.log('Fetching stream data...');
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error loading stream:', error);
        throw error;
      }

      return data;
    },
    enabled: !!user?.id
  });

  // Create stream mutation using OAuth
  const createStreamMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      console.log('Initializing stream with OAuth...');
      const { data, error } = await supabase.functions.invoke('oauth', {
        body: { 
          action: 'initialize_stream',
          userId: user.id
        }
      });
      
      if (error) {
        console.error('Error initializing stream:', error);
        throw error;
      }
      
      return data;
    },
    onError: (error) => {
      console.error('Failed to initialize stream:', error);
      toast.error('Failed to initialize stream. Please try again.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stream'] });
      toast.success('Stream initialized! You can now start streaming.');
    }
  });

  // End stream mutation
  const endStreamMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      console.log('Ending stream via OAuth...');
      const { data, error } = await supabase.functions.invoke('oauth', {
        body: { 
          action: 'end_stream',
          userId: user.id
        }
      });
      
      if (error) throw error;
      return data;
    },
    onError: (error) => {
      console.error('Failed to end stream:', error);
      toast.error('Failed to end stream. Please try again.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stream'] });
      toast.success('Stream ended successfully');
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Loading...</h2>
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
          title={stream.title || ''}
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
                  Initialize Stream
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

          <div className="space-y-4">
            {/* Stream Key Section */}
            <div>
              <h4 className="text-sm font-medium mb-2">Stream Key</h4>
              <div className="flex gap-2">
                <Input
                  type={showStreamKey ? 'text' : 'password'}
                  value={streamKey || ''}
                  readOnly
                  className="font-mono"
                  placeholder={isLoadingStreamKey ? 'Loading...' : 'No stream key generated'}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowStreamKey(!showStreamKey)}
                >
                  {showStreamKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(streamKey, 'Stream key')}
                  disabled={!streamKey}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => generateStreamKey.mutate()}
                  disabled={generateStreamKey.isPending}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${generateStreamKey.isPending ? 'animate-spin' : ''}`} />
                  Generate New Key
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Keep your stream key private. Generate a new one if it gets exposed.
              </p>
            </div>

            {/* Existing Stream URL and Access Token sections */}
            {stream?.streaming_url && (
              <>
                <div>
                  <h4 className="text-sm font-medium mb-2">Access Token</h4>
                  <div className="flex gap-2">
                    <Input
                      type={showToken ? 'text' : 'password'}
                      value={new URL(stream.streaming_url).searchParams.get('access_token') || ''}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(
                        new URL(stream.streaming_url).searchParams.get('access_token'),
                        'Access token'
                      )}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Stream URL</h4>
                  <div className="flex gap-2">
                    <Input
                      value={stream.streaming_url}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(stream.streaming_url, 'Stream URL')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Use this URL in your streaming software (OBS, Streamlabs, etc.)
                  </p>
                </div>
              </>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Keep your stream key and access token private. If compromised, generate new ones immediately.
          </p>
        </div>
      </Card>

      <OBSSetupGuide />
      
      {user?.id && <BroadcastPresetForm userId={user.id} />}
      
      <GameBoyControls />
    </div>
  );
};

export default Broadcasting;
