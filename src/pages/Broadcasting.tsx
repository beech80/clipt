
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
import type { Stream, StreamChatSettings } from "@/types/stream";

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
        .single();
      
      if (error) throw error;
      
      if (data) {
        const defaultChatSettings: StreamChatSettings = {
          slow_mode: false,
          slow_mode_interval: 0,
          subscriber_only: false,
          follower_only: false,
          follower_time_required: 0,
          emote_only: false,
          auto_mod_settings: {
            enabled: true,
            spam_detection: true,
            link_protection: true,
            caps_limit_percent: 80,
            max_emotes: 10,
            blocked_terms: []
          }
        };

        return {
          id: data.id,
          user_id: data.user_id,
          title: data.title,
          description: data.description,
          thumbnail_url: data.thumbnail_url,
          stream_key: data.stream_key,
          rtmp_url: data.rtmp_url || 'rtmp://stream.lovable.dev/live',
          stream_url: data.stream_url,
          playback_url: data.playback_url,
          is_live: !!data.is_live,
          viewer_count: data.viewer_count || 0,
          started_at: data.started_at,
          ended_at: data.ended_at,
          created_at: data.created_at,
          updated_at: data.updated_at || data.created_at,
          chat_enabled: data.chat_enabled,
          current_bitrate: data.current_bitrate,
          current_fps: data.current_fps,
          available_qualities: data.available_qualities,
          scheduled_start_time: data.scheduled_start_time,
          scheduled_duration: data.scheduled_duration,
          recurring_schedule: data.recurring_schedule,
          vod_enabled: data.vod_enabled,
          stream_settings: data.stream_settings,
          max_bitrate: data.max_bitrate,
          stream_latency_ms: data.stream_latency_ms,
          last_health_check: data.last_health_check,
          dvr_enabled: data.dvr_enabled,
          dvr_window_seconds: data.dvr_window_seconds,
          search_vector: data.search_vector,
          recommendation_score: data.recommendation_score,
          abr_active: data.abr_active,
          low_latency_active: data.low_latency_active,
          current_quality_preset: data.current_quality_preset,
          chat_settings: data.chat_settings as StreamChatSettings || defaultChatSettings,
          health_status: data.health_status,
          stream_resolution: data.stream_resolution,
          schedule_status: data.schedule_status,
          vod_processing_status: data.vod_processing_status,
          ingest_url: data.ingest_url,
          cdn_url: data.cdn_url,
          encrypted_stream_key: data.encrypted_stream_key
        };
      }
      return null;
    },
    enabled: !!user?.id
  });

  const createStreamMutation = useMutation({
    mutationFn: async () => {
      console.log('Creating new stream...');
      const { data, error } = await supabase.functions.invoke('mux-stream', {
        body: { action: 'create' }
      });
      
      if (error) {
        console.error('Error creating stream:', error);
        throw error;
      }
      console.log('Stream created:', data);
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
      console.log('Ending stream...');
      const { data, error } = await supabase.functions.invoke('mux-stream', {
        body: { action: 'end' }
      });
      
      if (error) {
        console.error('Error ending stream:', error);
        throw error;
      }
      console.log('Stream ended:', data);
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
                    value={stream.rtmp_url || 'rtmp://stream.lovable.dev/live'}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(stream.rtmp_url || 'rtmp://stream.lovable.dev/live', 'Stream URL')}
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
