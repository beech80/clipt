import React, { useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { StreamHealthIndicator } from "./health/StreamHealthIndicator";
import { StreamChat } from "./chat/StreamChat";
import { generatePlaybackUrl } from "@/config/streamingConfig";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // If no playbackUrl is provided, generate one from the streamId
  const effectivePlaybackUrl = playbackUrl || (streamId ? generatePlaybackUrl(streamId) : undefined);
  
  useEffect(() => {
    // If the stream is live and we have a video element, attempt to play it
    if (isLive && videoRef.current && effectivePlaybackUrl) {
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Error auto-playing video:', error);
          // Most browsers require user interaction to play video with sound
          // You can handle this by muting the video or showing a play button
        });
      }
    }
  }, [isLive, effectivePlaybackUrl]);

  if (!effectivePlaybackUrl) {
    return (
      <Card className="aspect-video w-full bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="mt-4 flex space-x-4">
            <div className="text-center">
              <p className="text-xs text-gray-500">Stream URL</p>
              <div className="mt-1 bg-black/30 px-3 py-1 rounded font-mono text-xs">
                {generatePlaybackUrl('')}
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Stream Key</p>
              <div className="mt-1 bg-black/30 px-3 py-1 rounded font-mono text-xs">
                ••••••••••••
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="lg:col-span-3 space-y-4">
        <Card className="p-4">
          <div className="aspect-video relative bg-gray-900">
            <video
              ref={videoRef}
              className="w-full h-full"
              src={effectivePlaybackUrl}
              autoPlay
              playsInline
              muted
              controls
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
