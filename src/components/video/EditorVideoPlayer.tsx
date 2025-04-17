import React, { useRef, useEffect, useState } from 'react';

interface EditorVideoPlayerProps {
  src: string;
  onTimeUpdate?: (currentTime: number) => void;
  onLoadedMetadata?: (duration: number) => void;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  currentTime?: number;
  playing?: boolean;
  startTime?: number;
  endTime?: number;
  previewMode?: boolean;
}

const EditorVideoPlayer: React.FC<EditorVideoPlayerProps> = ({
  src,
  onTimeUpdate,
  onLoadedMetadata,
  className = '',
  controls = true,
  autoPlay = false,
  muted = false,
  loop = false,
  currentTime,
  playing,
  startTime = 0,
  endTime,
  previewMode = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Update video element when src changes
  useEffect(() => {
    if (videoRef.current && src) {
      videoRef.current.load();
      setIsLoaded(false);
    }
  }, [src]);

  // Handle metadata loaded
  useEffect(() => {
    const handleMetadataLoaded = () => {
      if (videoRef.current) {
        setIsLoaded(true);
        console.log('Video metadata loaded. Duration:', videoRef.current.duration);
        if (onLoadedMetadata) {
          onLoadedMetadata(videoRef.current.duration);
        }
      }
    };

    const video = videoRef.current;
    if (video) {
      video.addEventListener('loadedmetadata', handleMetadataLoaded);
      return () => {
        video.removeEventListener('loadedmetadata', handleMetadataLoaded);
      };
    }
  }, [onLoadedMetadata]);

  // Handle time updates
  useEffect(() => {
    const handleTimeUpdate = () => {
      if (videoRef.current && onTimeUpdate) {
        onTimeUpdate(videoRef.current.currentTime);
      }

      // Handle preview mode looping
      if (previewMode && videoRef.current) {
        const video = videoRef.current;
        if (video.currentTime >= (endTime || video.duration) || video.currentTime < startTime) {
          video.currentTime = startTime;
          
          // Ensure it keeps playing
          if (playing && video.paused) {
            video.play().catch(err => console.error('Error playing video during trim loop:', err));
          }
        }
      }
    };

    const video = videoRef.current;
    if (video) {
      video.addEventListener('timeupdate', handleTimeUpdate);
      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [onTimeUpdate, previewMode, startTime, endTime, playing]);

  // Control playback state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (playing) {
      video.play().catch(err => {
        console.error('Error playing video:', err);
      });
    } else {
      video.pause();
    }
  }, [playing]);

  // Update current time when it changes externally
  useEffect(() => {
    const video = videoRef.current;
    if (video && currentTime !== undefined && Math.abs(video.currentTime - currentTime) > 0.5) {
      video.currentTime = currentTime;
    }
  }, [currentTime]);

  // Enable autoplay with user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true);
        
        if (autoPlay && videoRef.current) {
          videoRef.current.play().catch(err => {
            console.error('Autoplay failed even after user interaction:', err);
          });
        }
      }
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [autoPlay, hasUserInteracted]);

  return (
    <div className="video-container" style={{ display: 'block', width: '100%', height: '100%' }}>
      <video
        ref={videoRef}
        className={`video-player ${className}`}
        controls={controls}
        muted={muted}
        loop={loop}
        playsInline
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          backgroundColor: '#000'
        }}
      >
        <source src={src} type="video/mp4" />
        <source src={src} type="video/webm" />
        <source src={src} type="video/quicktime" />
        Your browser does not support HTML5 video.
      </video>
    </div>
  );
};

export default EditorVideoPlayer;
