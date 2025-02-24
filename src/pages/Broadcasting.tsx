
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import GameBoyControls from "@/components/GameBoyControls";
import { OBSSetupGuide } from "@/components/streaming/setup/OBSSetupGuide";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { StreamPlayer } from "@/components/streaming/StreamPlayer";
import { StreamControlPanel } from "@/components/streaming/StreamControlPanel";
import type { Stream } from "@/types/stream";

const Broadcasting = () => {
  const { user } = useAuth();

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

      {/* Stream Control Panel */}
      <Card className="p-6">
        <StreamControlPanel 
          stream={stream} 
          isLoading={isLoading}
          userId={user.id}
        />

        {stream?.streaming_url && (
          <div className="mt-6 space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Stream URL</h3>
              <p className="font-mono text-sm bg-muted p-2 rounded break-all">
                {stream.streaming_url}
              </p>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p>To stream using OBS Studio:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Open OBS Studio</li>
                <li>Go to Settings → Stream</li>
                <li>Select "Custom..." as the service</li>
                <li>Copy and paste the entire Stream URL above into the "Server" field</li>
                <li>Leave the "Stream Key" field empty</li>
                <li>Click "Apply" and then "OK"</li>
                <li>Click "Start Streaming" when ready</li>
              </ol>
              <p className="mt-4 text-sm">
                Your stream URL contains a secure token and will expire when you end your stream.
                Click "Initialize Stream" to get a new URL when you want to start streaming.
              </p>
            </div>
          </div>
        )}
      </Card>
      
      <OBSSetupGuide />
      
      <GameBoyControls />
    </div>
  );
};

export default Broadcasting;
