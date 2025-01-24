import { Card } from "@/components/ui/card";
import { ViewerCountManager } from "./ViewerCountManager";
import { StreamHealthMonitor } from "./StreamHealthMonitor";
import { StreamMetrics } from "./StreamMetrics";
import { StreamInteractivePanel } from "./StreamInteractivePanel";
import { StreamQualityControls } from "./StreamQualityControls";
import { QualityPresetManager } from "./QualityPresetManager";
import { EnhancedStreamMetrics } from "./analytics/EnhancedStreamMetrics";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface StreamAnalytics {
  current_bitrate: number;
  current_fps: number;
  peak_viewers?: number;
  average_viewers?: number;
  chat_messages_count?: number;
  unique_chatters?: number;
  stream_duration?: string;
  engagement_rate?: number;
}

interface EnhancedStreamDashboardProps {
  userId: string;
  isLive: boolean;
}

interface QualityPreset {
  resolution: string;
  bitrate: number;
  fps: number;
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
      
      const transformedData: StreamAnalytics = {
        current_bitrate: 0,
        current_fps: 0,
        peak_viewers: data?.peak_viewers || undefined,
        average_viewers: data?.average_viewers || undefined,
        chat_messages_count: data?.chat_messages_count || undefined,
        unique_chatters: data?.unique_chatters || undefined,
        stream_duration: data?.stream_duration?.toString() || undefined,
        engagement_rate: data?.engagement_rate || undefined
      };
      
      return transformedData;
    },
    enabled: isLive,
    refetchInterval: 5000
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
        (payload: { new: { current_bitrate?: number; current_fps?: number } }) => {
          if (payload.new) {
            setStreamMetrics(prevMetrics => ({
              ...prevMetrics,
              current_bitrate: payload.new.current_bitrate || 0,
              current_fps: payload.new.current_fps || 0
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isLive]);

  const handlePresetChange = (preset: QualityPreset) => {
    console.log('Selected preset:', preset);
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

      <EnhancedStreamMetrics streamId={userId} />

      <QualityPresetManager 
        streamId={userId}
        onPresetChange={handlePresetChange}
      />

      <StreamQualityControls
        streamId={userId}
        onQualityChange={(quality) => console.log('Quality changed:', quality)}
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