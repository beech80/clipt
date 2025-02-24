
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import GameBoyControls from "@/components/GameBoyControls";
import { OBSSetupGuide } from "@/components/streaming/setup/OBSSetupGuide";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { StreamPlayer } from "@/components/streaming/StreamPlayer";
import { StreamKeyManager } from "@/components/streaming/keys/StreamKeyManager";
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

      {user?.id && <StreamKeyManager userId={user.id} />}
      
      <OBSSetupGuide />
      
      <GameBoyControls />
    </div>
  );
};

export default Broadcasting;
