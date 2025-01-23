import { Card } from "@/components/ui/card";
import { ViewerCountManager } from "./ViewerCountManager";
import { StreamHealthMonitor } from "./StreamHealthMonitor";
import { StreamMetrics } from "./StreamMetrics";
import { StreamInteractivePanel } from "./StreamInteractivePanel";
import { StreamQualityControls } from "./StreamQualityControls";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface StreamAnalytics {
  current_bitrate: number;
  current_fps: number;
}

interface EnhancedStreamDashboardProps {
  userId: string;
  isLive: boolean;
}

export function EnhancedStreamDashboard({ userId, isLive }: EnhancedStreamDashboardProps) {
  const [viewerCount, setViewerCount] = useState(0);
  const [streamMetrics, setStreamMetrics] = useState<StreamAnalytics>({
    current_bitrate: 0,
    current_fps: 0
  });

  const { data: analytics } = useQuery({
    queryKey: ['stream-analytics', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stream_analytics')
        .select('*')
        .eq('stream_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data as StreamAnalytics;
    },
    enabled: isLive
  });

  useEffect(() => {
    if (!isLive) return;

    const channel = supabase
      .channel('stream-analytics')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stream_analytics',
          filter: `stream_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new) {
            setStreamMetrics({
              current_bitrate: payload.new.current_bitrate || 0,
              current_fps: payload.new.current_fps || 0
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isLive]);

  const handleQualityChange = async (quality: string) => {
    if (!isLive) return;

    const { error } = await supabase
      .from('streams')
      .update({ stream_resolution: quality })
      .eq('id', userId);

    if (error) throw error;
  };

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <ViewerCountManager 
            streamId={userId} 
            viewerCount={viewerCount}
            onViewerCountChange={setViewerCount}
          />
        </Card>
        <Card className="p-4">
          <StreamHealthMonitor streamId={userId} />
        </Card>
      </div>

      <StreamQualityControls
        streamId={userId}
        onQualityChange={handleQualityChange}
        onVolumeChange={(volume) => console.log('Volume changed:', volume)}
      />

      <Card className="p-4">
        <StreamMetrics 
          bitrate={streamMetrics.current_bitrate} 
          fps={streamMetrics.current_fps} 
        />
      </Card>

      <Card className="p-4">
        <StreamInteractivePanel 
          streamId={userId}
          isLive={isLive}
        />
      </Card>
    </div>
  );
}