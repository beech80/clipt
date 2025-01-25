import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { StreamPlayerControls } from './player/StreamPlayerControls';
import { StreamChat } from './StreamChat';
import { ViewerCountManager } from './ViewerCountManager';

interface StreamPlayerProps {
  streamUrl?: string | null;
  isLive?: boolean;
  autoplay?: boolean;
  controls?: boolean;
  qualities?: string[];
  streamId?: string;
}

export const StreamPlayer = ({ 
  streamUrl, 
  isLive = false, 
  autoplay = true,
  controls = true,
  qualities = [],
  streamId
}: StreamPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [currentQuality, setCurrentQuality] = useState<string>('auto');
  const [viewerCount, setViewerCount] = useState<number>(0);
  const [streamMetrics, setStreamMetrics] = useState({
    bitrate: 0,
    fps: 0,
    resolution: ''
  });

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;

    const initPlayer = () => {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });

        hlsRef.current = hls;
        hls.loadSource(streamUrl);
        hls.attachMedia(videoRef.current!);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (autoplay) {
            videoRef.current?.play().catch(() => {
              toast.error("Autoplay blocked. Please click play.");
            });
          }
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                initPlayer();
                break;
            }
          }
        });
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = streamUrl;
        if (autoplay) {
          videoRef.current.play().catch(() => {
            toast.error("Autoplay blocked. Please click play.");
          });
        }
      }
    };

    initPlayer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [streamUrl, autoplay]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="md:col-span-3">
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          {!isLive && !streamUrl && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              Stream is offline
            </div>
          )}
          
          <video
            ref={videoRef}
            className="w-full h-full"
            controls={controls}
            playsInline
            poster={!isLive ? "/placeholder.svg" : undefined}
          />
          
          <StreamPlayerControls
            qualities={qualities}
            currentQuality={currentQuality}
            onQualityChange={setCurrentQuality}
            streamMetrics={streamMetrics}
            className="absolute bottom-0 right-0"
          />

          {isLive && streamId && (
            <StreamAlertOverlay streamId={streamId} />
          )}
        </div>
      </div>

      <div className="md:col-span-1 h-[600px]">
        <StreamChat 
          streamId={streamId || ''} 
          isLive={isLive}
        />
      </div>

      {streamId && (
        <ViewerCountManager
          streamId={streamId}
          viewerCount={viewerCount}
          onViewerCountChange={setViewerCount}
        />
      )}
    </div>
  );
};
