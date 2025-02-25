
import React from 'react';
import { Card } from "@/components/ui/card";
import { StreamHealthIndicator } from "./health/StreamHealthIndicator";
import { StreamChat } from "./chat/StreamChat";

interface StreamPlayerProps {
  streamId: string;
  title?: string;
  isLive?: boolean;
  viewerCount?: number;
  playbackUrl?: string;
}

export const StreamPlayer = ({ 
  streamId,
  title = 'Live Stream',
  isLive = false,
  viewerCount = 0,
  playbackUrl
}: StreamPlayerProps) => {
  if (!playbackUrl) {
    return (
      <Card className="aspect-video w-full bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Stream is offline</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="lg:col-span-3 space-y-4">
        <Card className="p-4">
          <div className="aspect-video relative bg-gray-900">
            <video
              className="w-full h-full"
              src={playbackUrl}
              autoPlay
              playsInline
              muted
            />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="text-sm text-muted-foreground">
                {viewerCount} {viewerCount === 1 ? 'viewer' : 'viewers'}
              </p>
            </div>
            <StreamHealthIndicator 
              status={isLive ? 'excellent' : 'offline'} 
              className="ml-auto"
            />
          </div>
        </Card>
      </div>
      <div className="lg:col-span-1">
        <StreamChat streamId={streamId} isLive={isLive} />
      </div>
    </div>
  );
};
