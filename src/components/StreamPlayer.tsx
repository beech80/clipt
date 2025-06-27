import React, { useState, useEffect, useRef } from 'react';
import { cloudflareStreamService } from '@/services/cloudflareStreamService';
import { toast } from 'sonner';
import { Skeleton } from './ui/skeleton';
import { AlertCircle, Loader2 } from 'lucide-react';
import Hls from 'hls.js';

interface StreamPlayerProps {
  videoId: string;
  title?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  className?: string;
  posterUrl?: string;
  onReady?: () => void;
  onError?: (error: string) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
}

const StreamPlayer: React.FC<StreamPlayerProps> = ({
  videoId,
  title,
  autoPlay = false,
  muted = false,
  controls = true,
  className = '',
  posterUrl,
  onReady,
  onError,
  onPlay,
  onPause,
  onEnd
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    if (!videoId) {
      setError('No video ID provided');
      setLoading(false);
      return;
    }

    const loadStream = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check network connectivity
        if (!navigator.onLine) {
          throw new Error('No internet connection available');
        }

        // For regular videos use HLS URL
        const hlsUrl = cloudflareStreamService.getStreamUrl(videoId);
        setStreamUrl(hlsUrl);
        
        // Wait a bit to make sure stream is ready
        setTimeout(() => {
          setLoading(false);
          if (onReady) onReady();
        }, 1000);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load stream';
        setError(errorMessage);
        setLoading(false);
        if (onError) onError(errorMessage);
        toast.error('Failed to load stream');
        console.error('Stream player error:', err);
      }
    };

    loadStream();

    // Cleanup function
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoId, onError, onReady]);

  // Set up HLS.js when the streamUrl is available
  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;

    const video = videoRef.current;
    
    const initPlayer = () => {
      // Check if HLS.js is supported
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (autoPlay) {
            video.play().catch(e => {
              console.warn('Auto-play prevented:', e);
              // Most browsers require user interaction before playing with sound
              video.muted = true;
              video.play().catch(console.error);
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
                hls.destroy();
                setError('Failed to play the stream');
                if (onError) onError('Playback error: ' + data.details);
                break;
            }
          }
        });
        
        hlsRef.current = hls;
      } 
      // For browsers that natively support HLS (like Safari)
      else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
        video.addEventListener('loadedmetadata', () => {
          if (autoPlay) {
            video.play().catch(e => {
              console.warn('Auto-play prevented:', e);
              video.muted = true;
              video.play().catch(console.error);
            });
          }
        });
      } else {
        setError('HLS playback is not supported in this browser');
        if (onError) onError('HLS not supported');
      }
    };

    initPlayer();
  }, [streamUrl, autoPlay, onError]);

  // Set up event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handlePlay = () => {
      if (onPlay) onPlay();
    };
    
    const handlePause = () => {
      if (onPause) onPause();
    };
    
    const handleEnded = () => {
      if (onEnd) onEnd();
    };
    
    const handleError = (e: Event) => {
      console.error('Video error:', e);
      setError('Error playing video');
      if (onError) onError('Video playback error');
    };
    
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    
    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [onPlay, onPause, onEnd, onError]);

  if (error) {
    return (
      <div className={`bg-black aspect-video rounded-md flex items-center justify-center ${className}`}>
        <div className="text-center p-4">
          <AlertCircle className="h-10 w-10 mx-auto text-destructive mb-2" />
          <p className="text-white font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`${className}`}>
        <Skeleton className="aspect-video w-full rounded-md bg-muted/30 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </Skeleton>
        {title && <Skeleton className="h-6 w-3/4 mt-2" />}
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <video
        ref={videoRef}
        className="w-full aspect-video rounded-md bg-black"
        controls={controls}
        muted={muted}
        poster={posterUrl || cloudflareStreamService.getThumbnailUrl(videoId)}
        playsInline
      />
      {title && <h3 className="font-medium mt-2">{title}</h3>}
    </div>
  );
};

export default StreamPlayer;
