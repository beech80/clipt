import { Card } from "@/components/ui/card";
import { ViewerCountManager } from "./ViewerCountManager";
import { StreamHealthIndicator } from "./health/StreamHealthIndicator";
import { StreamMetrics } from "./StreamMetrics";
import { StreamInteractivePanel } from "./StreamInteractivePanel";
import { StreamKeyManager } from "./keys/StreamKeyManager";
import { OBSConnectionStatus } from "./obs/OBSConnectionStatus";
import { useState } from "react";

interface StreamDashboardProps {
  userId: string;
  isLive: boolean;
}

export function StreamDashboard({ userId, isLive }: StreamDashboardProps) {
  const [viewerCount, setViewerCount] = useState(0);
  const [streamMetrics, setStreamMetrics] = useState({
    bitrate: 0,
    fps: 0
  });

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
          <StreamHealthIndicator streamId={userId} />
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <OBSConnectionStatus streamId={userId} />
        <StreamKeyManager streamId={userId} />
      </div>

      <Card className="p-4">
        <StreamMetrics 
          bitrate={streamMetrics.bitrate} 
          fps={streamMetrics.fps} 
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