import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { StreamControls } from "@/components/streaming/StreamControls";
import { StreamInfoCards } from "@/components/streaming/StreamInfoCards";
import { StreamPlayer } from "@/components/streaming/StreamPlayer";

const Streaming = () => {
  const { user } = useAuth();
  const [streamData, setStreamData] = useState<{
    isLive: boolean;
    streamKey: string | null;
    streamUrl: string | null;
  }>({
    isLive: false,
    streamKey: null,
    streamUrl: null,
  });

  useEffect(() => {
    if (user) {
      loadStreamData();
    }
  }, [user]);

  const loadStreamData = async () => {
    try {
      const { data: stream, error } = await supabase
        .from("streams")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;

      if (stream) {
        setStreamData({
          isLive: stream.is_live || false,
          streamKey: stream.stream_key,
          streamUrl: stream.stream_url,
        });
      }
    } catch (error) {
      console.error("Error loading stream data:", error);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="gaming-card">
        <h1 className="gaming-gradient text-3xl font-bold tracking-tight mb-4">
          Stream Manager
        </h1>
        
        <StreamControls 
          userId={user?.id || ''} 
          onStreamUpdate={setStreamData} 
        />
        
        <StreamInfoCards 
          isLive={streamData.isLive} 
          streamKey={streamData.streamKey} 
        />

        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Stream Preview</h3>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
          <StreamPlayer 
            streamUrl={streamData.streamUrl}
            isLive={streamData.isLive}
          />
        </div>
      </div>
    </div>
  );
};

export default Streaming;