import { Gamepad2, Users, Share2, Clock, Copy, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDuration } from "@/utils/dateUtils";
import { StreamHealthIndicator } from "./StreamHealthIndicator";

interface StreamInfoCardsProps {
  isLive: boolean;
  streamKey: string | null;
  streamUrl: string | null;
  viewerCount?: number;
  startedAt?: string | null;
  healthStatus?: string;
  bitrate?: number;
  fps?: number;
  resolution?: string;
}

export const StreamInfoCards = ({ 
  isLive, 
  streamKey, 
  streamUrl,
  viewerCount = 0,
  startedAt,
  healthStatus = 'unknown',
  bitrate,
  fps,
  resolution
}: StreamInfoCardsProps) => {
  const handleCopy = (text: string | null, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text)
      .then(() => toast.success(`${label} copied to clipboard`))
      .catch(() => toast.error(`Failed to copy ${label}`));
  };

  const streamDuration = startedAt ? formatDuration(new Date(startedAt), new Date()) : '0:00';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="glass-card p-4">
        <Activity className="h-6 w-6 mb-2 text-gaming-400" />
        <StreamHealthIndicator
          status={healthStatus}
          bitrate={bitrate}
          fps={fps}
          resolution={resolution}
        />
      </div>
      
      <div className="glass-card p-4">
        <Users className="h-6 w-6 mb-2 text-gaming-400" />
        <h3 className="font-semibold mb-1">Viewers</h3>
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">{viewerCount}</p>
          {isLive && (
            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </div>
      </div>

      <div className="glass-card p-4">
        <Clock className="h-6 w-6 mb-2 text-gaming-400" />
        <h3 className="font-semibold mb-1">Duration</h3>
        <p className="text-sm text-muted-foreground">
          {isLive ? streamDuration : 'Not streaming'}
        </p>
      </div>

      <div className="glass-card p-4">
        <Share2 className="h-6 w-6 mb-2 text-gaming-400" />
        <h3 className="font-semibold mb-1">Stream Info</h3>
        <div className="space-y-2">
          {streamKey && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => handleCopy(streamKey, 'Stream key')}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Stream Key
            </Button>
          )}
          {streamUrl && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => handleCopy(streamUrl, 'Stream URL')}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Stream URL
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};