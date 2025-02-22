
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from "@/lib/supabase";
import { EnhancedGamingDashboard } from "@/components/streaming/EnhancedGamingDashboard";
import { GameBoyControls } from "@/components/GameBoyControls";
import { ChatModerationDashboard } from "@/components/streaming/moderation/ChatModerationDashboard";
import { StreamHeader } from "@/components/streaming/StreamHeader";
import { StreamKeyDisplay } from "@/components/streaming/StreamKeyDisplay";
import { StreamControlPanel } from "@/components/streaming/StreamControlPanel";

export default function Streaming() {
  const { user } = useAuth();
  const rtmpUrl = "rtmp://stream.lovable.dev/live";

  // Query for existing stream
  const { data: stream, isLoading, error: streamError } = useQuery({
    queryKey: ['stream', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      console.log('Fetching stream data for user:', user.id);
      const { data: existingStream, error } = await supabase
        .from('streams')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching stream:', error);
        throw error;
      }

      // If no stream exists, create one
      if (!existingStream) {
        console.log('No stream found, creating new stream...');
        const { data: newStream, error: createError } = await supabase.functions.invoke('mux-stream', {
          body: { action: 'create', userId: user.id }
        });
        
        if (createError) {
          console.error('Error creating stream:', createError);
          throw createError;
        }
        
        console.log('New stream created:', newStream);
        return newStream;
      }
      
      console.log('Found existing stream:', existingStream);
      return existingStream;
    },
    enabled: !!user?.id,
    retry: 1,
    staleTime: 30000
  });

  if (!user) {
    return (
      <Alert>
        <AlertDescription>Please log in to access streaming features.</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (streamError) {
    console.error('Stream error:', streamError);
    return (
      <Alert>
        <AlertDescription>Failed to load streaming data. Please try again.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <StreamHeader />

      <Card className="p-6 space-y-4">
        <StreamControlPanel 
          stream={stream} 
          isLoading={isLoading}
          userId={user.id}
        />
        
        <StreamKeyDisplay stream={stream} rtmpUrl={rtmpUrl} />

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
