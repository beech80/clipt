import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { StreamControls } from "@/components/streaming/StreamControls";
import { StreamInfoCards } from "@/components/streaming/StreamInfoCards";
import { StreamPlayer } from "@/components/streaming/StreamPlayer";
import { StreamChat } from "@/components/streaming/StreamChat";
import { StreamSettings } from "@/components/streaming/StreamSettings";

const Streaming = () => {
  const { user } = useAuth();
  const [streamData, setStreamData] = useState<{
    id: string | null;
    isLive: boolean;
    streamKey: string | null;
    streamUrl: string | null;
  }>({
    id: null,
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
          id: stream.id,
          isLive: stream.is_live || false,
          streamKey: stream.stream_key,
          streamUrl: stream.stream_url,
        });
      }
    } catch (error) {
      console.error("Error loading stream data:", error);
    }
  };

  const handleStreamUpdate = (data: { isLive: boolean; streamKey: string | null; streamUrl: string | null }) => {
    setStreamData(prev => ({
      ...prev,
      ...data
    }));
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 space-y-8">
      <div className="gaming-card">
        <h1 className="gaming-gradient text-3xl font-bold tracking-tight mb-4">
          Stream Manager
        </h1>
        
        <StreamControls 
          userId={user.id} 
          onStreamUpdate={handleStreamUpdate}
        />
        
        <StreamInfoCards 
          isLive={streamData.isLive} 
          streamKey={streamData.streamKey} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Stream Preview</h3>
              </div>
              <StreamPlayer 
                streamUrl={streamData.streamUrl}
                isLive={streamData.isLive}
              />
            </div>
          </div>
          <div className="lg:col-span-1">
            {streamData.id && (
              <StreamChat 
                streamId={streamData.id} 
                isLive={streamData.isLive} 
              />
            )}
          </div>
        </div>

        <div className="mt-8">
          <StreamSettings userId={user.id} />
        </div>
      </div>
    </div>
  );
};

export default Streaming;