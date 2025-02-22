
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Eye, EyeOff, Calendar, Radio } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { EnhancedGamingDashboard } from "@/components/streaming/EnhancedGamingDashboard";
import GameBoyControls from "@/components/GameBoyControls";
import { BackButton } from "@/components/ui/back-button";
import { useNavigate } from "react-router-dom";
import { ChatModerationDashboard } from "@/components/streaming/moderation/ChatModerationDashboard";
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import type { Stream } from "@/types/stream";

export default function Streaming() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showKey, setShowKey] = useState(false);
  const queryClient = useQueryClient();
  const rtmpUrl = "rtmp://stream.lovable.dev/live";

  const { data: stream, isLoading } = useQuery<Stream | null>({
    queryKey: ['stream', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Stream;
    },
    enabled: !!user?.id
  });

  const startStream = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('mux-stream', {
        body: { action: 'create' }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stream'] });
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
      <Alert>
        <AlertDescription>Please log in to access streaming features.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-3xl font-bold">Streaming Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/schedule')}
            title="Schedule Stream"
          >
            <Calendar className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/broadcasting')}
            title="Broadcasting Setup"
          >
            <Radio className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="p-6 space-y-4">
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
        
        {stream && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Stream Key</label>
              <div className="flex gap-2">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={stream.stream_key || ''}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowKey(!showKey)}
                  title={showKey ? 'Hide Stream Key' : 'Show Stream Key'}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(stream.stream_key, 'Stream key')}
                  title="Copy Stream Key"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Keep your stream key private. Never share it with anyone.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">RTMP URL</label>
              <div className="flex gap-2">
                <Input value={rtmpUrl} readOnly className="font-mono" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(rtmpUrl, 'RTMP URL')}
                  title="Copy RTMP URL"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Use this URL in your streaming software (OBS, Streamlabs, etc.)
              </p>
            </div>

            <Alert>
              <AlertDescription>
                To start streaming:
                <ol className="list-decimal ml-4 mt-2">
                  <li>Copy the RTMP URL and Stream Key</li>
                  <li>Open your streaming software (e.g., OBS Studio)</li>
                  <li>Go to Settings → Stream</li>
                  <li>Set Service to "Custom"</li>
                  <li>Paste the RTMP URL into "Server"</li>
                  <li>Paste your Stream Key into "Stream Key"</li>
                  <li>Click "Apply" and "OK"</li>
                  <li>Click "Start Stream" in your software</li>
                </ol>
              </AlertDescription>
            </Alert>
          </>
        )}
      </Card>

      {stream?.id && <ChatModerationDashboard streamId={stream.id} />}

      <EnhancedGamingDashboard 
        streamId={stream?.id || ''} 
        userId={user.id}
        isLive={stream?.is_live || false}
      />

      <GameBoyControls />
    </div>
  );
}
