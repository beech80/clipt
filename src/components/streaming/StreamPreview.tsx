import React, { useRef, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Hls from 'hls.js';

interface StreamPreviewProps {
  streamUrl?: string;
  onGoLive?: () => void;
  className?: string;
}

const StreamPreview = ({ streamUrl, onGoLive, className = '' }: StreamPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;

    const video = videoRef.current;
    
    if (Hls.isSupported()) {
      const hls = new Hls({
        debug: false,
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().catch(error => {
          console.error('Error playing video:', error);
          setHasError(true);
          toast.error("Failed to play stream preview");
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          setHasError(true);
          setIsLoading(false);
          toast.error("Failed to load stream preview");
        }
      });

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // For Safari
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().catch(error => {
          console.error('Error playing video:', error);
          setHasError(true);
          toast.error("Failed to play stream preview");
        });
      });

      video.addEventListener('error', () => {
        setHasError(true);
        setIsLoading(false);
        toast.error("Failed to load stream preview");
      });
    }
  }, [streamUrl]);

  const handleGoLive = () => {
    if (onGoLive) {
      onGoLive();
      toast.success("Going live!");
    }
  };

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
          <p className="text-white mb-4">Failed to load preview</p>
          <Button 
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
      />

      <div className="absolute bottom-4 right-4">
        <Button
          onClick={handleGoLive}
          disabled={isLoading || hasError}
          variant="default"
          className="bg-red-500 hover:bg-red-600"
        >
          Go Live
        </Button>
      </div>
    </div>
  );
};

export default StreamPreview;