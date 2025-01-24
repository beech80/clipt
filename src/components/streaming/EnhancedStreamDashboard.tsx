import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { StreamMetricsSection } from "./dashboard/StreamMetricsSection";
import { StreamControlsSection } from "./dashboard/StreamControlsSection";
import type { StreamAnalytics, QualityPreset } from "@/types/streaming";

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
      <StreamMetricsSection
        userId={userId}
        streamId={userId}
        viewerCount={viewerCount}
        streamMetrics={streamMetrics}
        onViewerCountChange={setViewerCount}
      />

      <StreamControlsSection
        userId={userId}
        streamId={userId}
        isLive={isLive}
        onPresetChange={handlePresetChange}
      />
    </div>
  );
}