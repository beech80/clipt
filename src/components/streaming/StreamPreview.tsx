import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

interface StreamPreviewProps {
  streamUrl?: string;
  isLive?: boolean;
}

export function StreamPreview({ streamUrl, isLive }: StreamPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;

    const video = videoRef.current;
    let hls: Hls;

    const initializePlayer = async () => {
      setIsLoading(true);
      setError("");

      try {
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Native HLS support (Safari)
          video.src = streamUrl;
        } else if (Hls.isSupported()) {
          // HLS.js support
          hls = new Hls({
            debug: false,
            enableWorker: true,
            lowLatencyMode: true,
          });

          hls.loadSource(streamUrl);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
            if (isLive) {
              video.play().catch(console.error);
            }
          });

          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  setError("Network error while loading stream");
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  setError("Media error: stream cannot be played");
                  break;
                default:
                  setError("An error occurred while loading the stream");
                  break;
              }
              setIsLoading(false);
            }
          });
        }
      } catch (err) {
        setError("Failed to initialize stream preview");
        setIsLoading(false);
      }
    };

    initializePlayer();

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [streamUrl, isLive]);

  if (!streamUrl) {
    return (
      <Card className="aspect-video bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">No preview available</p>
      </Card>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <video
        ref={videoRef}
        className="w-full aspect-video bg-muted rounded-lg"
        playsInline
        controls={isLive}
        muted
      />
    </div>
  );
}