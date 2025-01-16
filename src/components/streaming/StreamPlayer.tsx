import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { toast } from "sonner";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StreamPlayerProps {
  streamUrl?: string | null;
  isLive?: boolean;
  autoplay?: boolean;
  controls?: boolean;
  qualities?: string[];
}

export const StreamPlayer = ({ 
  streamUrl, 
  isLive = false, 
  autoplay = true,
  controls = true,
  qualities = []
}: StreamPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [currentQuality, setCurrentQuality] = useState<string>('auto');

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;

    console.log("Initializing stream player with URL:", streamUrl);

    const initPlayer = () => {
      if (Hls.isSupported()) {
        console.log("HLS is supported, initializing player...");
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });

        hlsRef.current = hls;
        hls.loadSource(streamUrl);
        hls.attachMedia(videoRef.current!);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log("HLS manifest parsed, attempting autoplay...");
          if (autoplay) {
            videoRef.current?.play().catch(() => {
              console.log("Autoplay blocked by browser");
              toast.error("Autoplay blocked. Please click play.");
            });
          }
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          console.log("HLS error:", data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log("Network error, attempting to recover...");
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log("Media error, attempting to recover...");
                hls.recoverMediaError();
                break;
              default:
                console.log("Fatal error, reinitializing player...");
                initPlayer();
                break;
            }
          }
        });

        // Handle quality levels
        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          const levels = hls.levels;
          const currentLevel = levels[data.level];
          console.log("Quality switched to:", currentLevel?.height + "p");
        });
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        // For Safari
        console.log("Using native HLS support for Safari");
        videoRef.current.src = streamUrl;
        if (autoplay) {
          videoRef.current.play().catch(() => {
            console.log("Autoplay blocked in Safari");
            toast.error("Autoplay blocked. Please click play.");
          });
        }
      }
    };

    initPlayer();

    return () => {
      console.log("Cleaning up stream player...");
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [streamUrl, autoplay]);

  const handleQualityChange = (quality: string) => {
    const hls = hlsRef.current;
    if (!hls) return;

    setCurrentQuality(quality);
    if (quality === 'auto') {
      hls.currentLevel = -1; // Auto quality
    } else {
      const level = hls.levels.findIndex(
        level => level.height === parseInt(quality)
      );
      if (level !== -1) {
        hls.currentLevel = level;
      }
    }
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group">
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
      
      {qualities.length > 0 && (
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                {currentQuality}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleQualityChange('auto')}>
                Auto
              </DropdownMenuItem>
              {qualities.map((quality) => (
                <DropdownMenuItem 
                  key={quality}
                  onClick={() => handleQualityChange(quality)}
                >
                  {quality}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};