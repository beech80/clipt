import { Card } from "@/components/ui/card";
import { ViewerCountManager } from "./ViewerCountManager";
import { StreamHealthMonitor } from "./StreamHealthMonitor";
import { StreamMetrics } from "./StreamMetrics";
import { StreamInteractivePanel } from "./StreamInteractivePanel";

interface StreamDashboardProps {
  userId: string;
  isLive: boolean;
}

export function StreamDashboard({ userId, isLive }: StreamDashboardProps) {
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <ViewerCountManager streamId={userId} />
        </Card>
        <Card className="p-4">
          <StreamHealthMonitor streamId={userId} />
        </Card>
      </div>

      <Card className="p-4">
        <StreamMetrics streamId={userId} />
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