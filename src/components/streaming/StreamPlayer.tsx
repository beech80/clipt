import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { toast } from "sonner";

interface StreamPlayerProps {
  streamUrl?: string | null;
  isLive?: boolean;
  autoplay?: boolean;
  controls?: boolean;
}

export const StreamPlayer = ({ 
  streamUrl, 
  isLive = false, 
  autoplay = true,
  controls = true 
}: StreamPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

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
        // For Safari
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
    </div>
  );
};