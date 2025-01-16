import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { QualitySelector } from './QualitySelector';

interface StreamPreviewProps {
  streamUrl: string | null;
  isLive: boolean;
  className?: string;
}

export const StreamPreview = ({ streamUrl, isLive, className }: StreamPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [qualities, setQualities] = useState<string[]>([]);
  const [currentQuality, setCurrentQuality] = useState('auto');

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;

    let hls: Hls | null = null;

    const initializePlayer = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (Hls.isSupported()) {
          hls = new Hls({
            debug: false,
            enableWorker: true,
            lowLatencyMode: true,
          });

          hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
            const availableQualities = data.levels.map(level => 
              `${level.height}p`
            );
            setQualities(availableQualities);
            setIsLoading(false);
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.error('Network error:', data);
                  setError('Stream connection failed. Please try again.');
                  hls?.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.error('Media error:', data);
                  setError('Stream playback error. Please try again.');
                  hls?.recoverMediaError();
                  break;
                default:
                  console.error('Fatal error:', data);
                  setError('Failed to load stream. Please try again.');
                  break;
              }
            }
          });

          hls.loadSource(streamUrl);
          hls.attachMedia(videoRef.current);
          await videoRef.current.play().catch(error => {
            console.log('Autoplay prevented:', error);
          });
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          // For Safari which has native HLS support
          videoRef.current.src = streamUrl;
          await videoRef.current.play().catch(error => {
            console.log('Autoplay prevented:', error);
          });
          setIsLoading(false);
        } else {
          setError('Your browser does not support HLS playback.');
        }
      } catch (err) {
        console.error('Stream initialization error:', err);
        setError('Failed to initialize stream player.');
      }
    };

    if (isLive) {
      initializePlayer();
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [streamUrl, isLive]);

  const handleQualityChange = (quality: string) => {
    if (!videoRef.current || !quality) return;
    
    setCurrentQuality(quality);
    // Implementation for quality switching would go here
    // This requires integration with your streaming server
  };

  if (!isLive) {
    return (
      <div className="relative aspect-video bg-background/95 flex items-center justify-center">
        <p className="text-muted-foreground">Stream is offline</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="relative aspect-video bg-background/95">
        <video
          ref={videoRef}
          className="w-full h-full"
          playsInline
          muted
          controls
        />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      {qualities.length > 0 && (
        <QualitySelector
          qualities={qualities}
          currentQuality={currentQuality}
          onQualityChange={handleQualityChange}
          className="absolute bottom-4 right-4"
        />
      )}
    </div>
  );
};