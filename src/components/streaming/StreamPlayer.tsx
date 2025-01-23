import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { StreamPlayerControls } from './player/StreamPlayerControls';
import { StreamPlayerChat } from './player/StreamPlayerChat';
import { StreamPlayerGifts } from './player/StreamPlayerGifts';
import { ViewerCountManager } from './ViewerCountManager';
import { CDNManager } from './CDNManager';
import { DVRControls } from './DVRControls';

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
  const [healthStatus, setHealthStatus] = useState<string>('unknown');
  const [viewerCount, setViewerCount] = useState<number>(0);
  const [currentCDN, setCurrentCDN] = useState(streamUrl);
  const [streamMetrics, setStreamMetrics] = useState({
    bitrate: 0,
    fps: 0,
    resolution: ''
  });

  const handleCDNChange = (newUrl: string) => {
    setCurrentCDN(newUrl);
    if (hlsRef.current) {
      hlsRef.current.loadSource(newUrl);
    }
  };

  useEffect(() => {
    if (!currentCDN || !videoRef.current) return;

    const initPlayer = () => {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });

        hlsRef.current = hls;
        hls.loadSource(currentCDN);
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
        videoRef.current.src = currentCDN;
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
  }, [currentCDN, autoplay]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group">
      {!isLive && !currentCDN && (
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
      
      {streamId && (
        <>
          <StreamPlayerChat
            streamId={streamId}
            viewerCount={viewerCount}
            onViewerCountChange={setViewerCount}
          />
          <StreamPlayerGifts
            streamId={streamId}
            isLive={isLive}
          />
          <DVRControls
            streamId={streamId}
            videoRef={videoRef}
          />
        </>
      )}

      <StreamPlayerControls
        qualities={qualities}
        currentQuality={currentQuality}
        onQualityChange={setCurrentQuality}
        streamMetrics={streamMetrics}
        className="absolute bottom-0 right-0"
      />

      <CDNManager
        streamUrl={streamUrl || ''}
        onCDNChange={handleCDNChange}
      />

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