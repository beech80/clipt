import { Card } from "@/components/ui/card";
import { ViewerCountManager } from "../ViewerCountManager";
import { StreamHealthMonitor } from "../StreamHealthMonitor";
import { StreamMetrics } from "../StreamMetrics";
import { EnhancedStreamMetrics } from "../analytics/EnhancedStreamMetrics";
import type { StreamMetrics as StreamMetricsType } from "@/types/streaming";

interface StreamMetricsSectionProps {
  userId: string;
  streamId: string;
  viewerCount: number;
  streamMetrics: StreamMetricsType;
  onViewerCountChange: (count: number) => void;
}

export function StreamMetricsSection({
  userId,
  streamId,
  viewerCount,
  streamMetrics,
  onViewerCountChange
}: StreamMetricsSectionProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <ViewerCountManager 
            streamId={streamId} 
            viewerCount={viewerCount}
            onViewerCountChange={onViewerCountChange}
          />
        </Card>
        <Card className="p-4">
          <StreamHealthMonitor streamId={streamId} />
        </Card>
      </div>

      <EnhancedStreamMetrics streamId={streamId} />

      <Card className="p-4">
        <StreamMetrics 
          bitrate={streamMetrics.bitrate} 
          fps={streamMetrics.fps} 
        />
      </Card>
    </>
  );
}