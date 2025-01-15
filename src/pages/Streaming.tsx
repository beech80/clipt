import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { StreamControls } from "@/components/streaming/StreamControls";
import { StreamInfoCards } from "@/components/streaming/StreamInfoCards";
import { StreamPlayer } from "@/components/streaming/StreamPlayer";
import { StreamChat } from "@/components/streaming/StreamChat";
import { StreamSettings } from "@/components/streaming/StreamSettings";
import { toast } from "sonner";

const Streaming = () => {
  const { user } = useAuth();
  const [streamData, setStreamData] = useState<{
    id: string | null;
    isLive: boolean;
    streamKey: string | null;
    streamUrl: string | null;
    viewerCount: number;
    startedAt: string | null;
  }>({
    id: null,
    isLive: false,
    streamKey: null,
    streamUrl: null,
    viewerCount: 0,
    startedAt: null,
  });

  useEffect(() => {
    if (user) {
      loadStreamData();
      const interval = setInterval(() => {
        if (streamData.isLive) {
          updateViewerCount();
        }
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, streamData.isLive]);

  const loadStreamData = async () => {
    try {
      const { data: stream, error } = await supabase
        .from("streams")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) {
        toast.error("Failed to load stream data");
        return;
      }

      if (stream) {
        setStreamData({
          id: stream.id,
          isLive: stream.is_live || false,
          streamKey: stream.stream_key,
          streamUrl: stream.stream_url,
          viewerCount: stream.viewer_count || 0,
          startedAt: stream.started_at,
        });
      }
    } catch (error) {
      console.error("Error loading stream data:", error);
      toast.error("Failed to load stream data");
    }
  };

  const updateViewerCount = async () => {
    if (!streamData.id) return;
    
    try {
      const { data, error } = await supabase
        .from("streams")
        .select("viewer_count")
        .eq("id", streamData.id)
        .single();

      if (error) throw error;

      if (data) {
        setStreamData(prev => ({
          ...prev,
          viewerCount: data.viewer_count || 0
        }));
      }
    } catch (error) {
      console.error("Error updating viewer count:", error);
    }
  };

  const handleStreamUpdate = (data: { isLive: boolean; streamKey: string | null; streamUrl: string | null }) => {
    setStreamData(prev => ({
      ...prev,
      ...data,
      startedAt: data.isLive ? new Date().toISOString() : null,
      viewerCount: data.isLive ? 0 : prev.viewerCount,
    }));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Please log in to access streaming features.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="gaming-card">
        <h1 className="gaming-gradient text-3xl font-bold tracking-tight mb-4">
          Stream Manager
        </h1>
        
        <StreamControls 
          userId={user.id}
          isLive={streamData.isLive}
          onStreamUpdate={handleStreamUpdate}
        />
        
        <StreamInfoCards 
          isLive={streamData.isLive}
          streamKey={streamData.streamKey}
          streamUrl={streamData.streamUrl}
          viewerCount={streamData.viewerCount}
          startedAt={streamData.startedAt}
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