import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface MuxPlayerProps {
  playbackId: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  onError?: (error: Error) => void;
  onPlaying?: () => void;
  onPause?: () => void;
  className?: string;
}

const MuxPlayer: React.FC<MuxPlayerProps> = ({
  playbackId,
  poster,
  autoPlay = false,
  muted = false,
  loop = false,
  onError,
  onPlaying,
  onPause,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playbackId) return;

    const playbackUrl = `https://stream.mux.com/${playbackId}.m3u8`;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        xhrSetup: (xhr) => {
          // Set explicit Accept header to avoid MIME type issues
          xhr.setRequestHeader('Accept', 'application/vnd.apple.mpegurl, application/x-mpegurl, */*');
        }
      });

      let loadAttempts = 0;
      const maxAttempts = 2;

      const loadWithRetry = () => {
        try {
          hls.loadSource(playbackUrl);
          hls.attachMedia(video);
        } catch (err) {
          console.error('Error loading HLS source:', err);
          if (loadAttempts < maxAttempts) {
            loadAttempts++;
            console.log(`Retrying HLS load (${loadAttempts}/${maxAttempts})...`);
            setTimeout(loadWithRetry, 1000);
          } else {
            onError?.(new Error('Failed to load video after multiple attempts'));
          }
        }
      };

      loadWithRetry();

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoaded(true);
        if (autoPlay) {
          // Use a more reliable approach for autoplay
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('Autoplay started successfully');
              })
              .catch(err => {
                console.warn('Autoplay prevented:', err);
                // If autoplay fails due to browser policy, mute and try again
                if (err.name === 'NotAllowedError') {
                  video.muted = true;
                  video.play().catch(e => console.error('Failed even with muted autoplay:', e));
                }
              });
          }
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.warn('HLS error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Fatal network error, attempting to recover...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Fatal media error, attempting to recover...');
              hls.recoverMediaError();
              break;
            default:
              console.error('Unrecoverable HLS error:', data);
              onError?.(new Error(`Fatal HLS error: ${data.details}`));
              break;
          }
        }
      });

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = playbackUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoaded(true);
        if (autoPlay) {
          video.play().catch(console.error);
        }
      });
    }
  }, [playbackId, autoPlay, onError]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      setProgress((video.currentTime / video.duration) * 100);
    };

    video.addEventListener('timeupdate', updateProgress);
    return () => video.removeEventListener('timeupdate', updateProgress);
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      onPause?.();
    } else {
      videoRef.current.play();
      setIsPlaying(true);
      onPlaying?.();
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className={`relative group ${className}`}>
      <video
        ref={videoRef}
        poster={poster}
        muted={isMuted}
        loop={loop}
        playsInline
        className={`w-full h-full object-cover ${!isLoaded ? 'invisible' : ''}`}
      />

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <Progress value={progress} className="h-1 mb-4" />
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlay}
            className="text-white hover:text-white/80"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="text-white hover:text-white/80"
          >
            {isMuted ? (
              <VolumeX className="h-6 w-6" />
            ) : (
              <Volume2 className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MuxPlayer;