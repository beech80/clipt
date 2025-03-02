import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BroadcastPresetForm } from "@/components/broadcasting/BroadcastPresetForm";
import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { OBSSetupGuide } from "@/components/streaming/setup/OBSSetupGuide";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Copy, Radio, StopCircle, RefreshCw, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { StreamPlayer } from "@/components/streaming/StreamPlayer";
import { StreamKeyManager } from "@/components/streaming/broadcast/StreamKeyManager";
import { getUserStream, startStream, endStream } from "@/services/streamService";
import type { Stream } from "@/types/stream";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Broadcasting = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("stream-key");

  // Query for stream data using our new streamService
  const { data: streamData, isLoading, refetch } = useQuery({
    queryKey: ['stream', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      console.log('Fetching stream data...');
      const { data, error } = await getUserStream();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Start stream mutation
  const startStreamMutation = useMutation({
    mutationFn: async () => {
      if (!streamData?.id) throw new Error('Stream not found');
      const { data, error } = await startStream(streamData.id);
      if (error) throw error;
      return data;
    },
    onError: (error) => {
      console.error('Failed to start stream:', error);
      toast.error('Failed to start stream. Please try again.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stream'] });
      toast.success('Stream started! You can now broadcast through OBS.');
    }
  });

  // End stream mutation
  const endStreamMutation = useMutation({
    mutationFn: async () => {
      if (!streamData?.id) throw new Error('Stream not found');
      const { data, error } = await endStream(streamData.id);
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
          <div className="flex justify-center">
            <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
          <h2 className="text-xl font-bold mt-4">Loading your broadcasting studio...</h2>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6 pb-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-2xl font-bold">Broadcasting Studio</h1>
        </div>
        {streamData?.is_live && (
          <div className="flex items-center">
            <div className="bg-red-500 animate-pulse h-3 w-3 rounded-full mr-2"></div>
            <span className="text-sm font-medium">LIVE</span>
            <span className="mx-2 text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{streamData.viewer_count || 0} viewers</span>
          </div>
        )}
      </div>

      {streamData && streamData.is_live && (
        <StreamPlayer
          streamId={streamData.id}
          title={streamData.title || ''}
          isLive={streamData.is_live}
          viewerCount={streamData.viewer_count || 0}
          playbackUrl={streamData.playback_url}
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start mb-6">
          <TabsTrigger value="stream-key">Stream Settings</TabsTrigger>
          <TabsTrigger value="obs-setup">OBS Setup Guide</TabsTrigger>
          <TabsTrigger value="presets">Stream Presets</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stream-key" className="space-y-6">
          {/* Stream Control Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Stream Control</h3>
                <p className="text-sm text-muted-foreground">Start or end your live broadcast</p>
              </div>
              
              <div className="flex gap-2">
                {!streamData?.is_live ? (
                  <Button
                    onClick={() => startStreamMutation.mutate()}
                    disabled={startStreamMutation.isPending}
                    className="gap-2"
                  >
                    {startStreamMutation.isPending ? (
                      <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                    ) : (
                      <Radio className="h-4 w-4" />
                    )}
                    Go Live
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={() => endStreamMutation.mutate()}
                    disabled={endStreamMutation.isPending}
                    className="gap-2"
                  >
                    {endStreamMutation.isPending ? (
                      <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                    ) : (
                      <StopCircle className="h-4 w-4" />
                    )}
                    End Stream
                  </Button>
                )}
                
                {streamData?.is_live && (
                  <Button 
                    variant="outline"
                    onClick={() => window.open(`/live/${streamData.stream_path || streamData.id}`, '_blank')}
                    className="gap-2"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    View Stream
                  </Button>
                )}
              </div>
            </div>
            
            {/* Stream Key Manager */}
            {streamData && <StreamKeyManager streamId={streamData.id} />}
          </Card>
        </TabsContent>
        
        <TabsContent value="obs-setup">
          <Card className="p-6">
            <OBSSetupGuide />
          </Card>
        </TabsContent>
        
        <TabsContent value="presets">
          <Card className="p-6">
            <BroadcastPresetForm />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Broadcasting;
