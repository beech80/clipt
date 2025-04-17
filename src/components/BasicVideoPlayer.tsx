import React, { useRef, useEffect, forwardRef, RefObject, useImperativeHandle } from 'react';
import './video-fixes.css';

interface BasicVideoPlayerProps {
  src: string;
  onLoaded?: (duration: number) => void;
  autoPlay?: boolean;
  controls?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
}

const BasicVideoPlayer = forwardRef<HTMLVideoElement, BasicVideoPlayerProps>(({ 
  src, 
  onLoaded, 
  autoPlay = true, 
  controls = true, 
  muted = false,
  loop = false,
  className = ""
}: BasicVideoPlayerProps, ref) => {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  
  // Allow parent component to access the video element directly
  useImperativeHandle(ref, () => internalVideoRef.current as HTMLVideoElement);

  useEffect(() => {
    const videoElement = internalVideoRef.current;
    if (!videoElement) return;

    const handleLoadedMetadata = () => {
      if (videoElement && onLoaded) {
        onLoaded(videoElement.duration);
      }
      
      // Force video to be visible
      videoElement.style.display = 'block';
      videoElement.style.width = '100%';
      videoElement.style.height = '70vh';
      videoElement.style.objectFit = 'cover';
      videoElement.style.backgroundColor = 'black';
      
      // Try to play
      if (autoPlay) {
        const playPromise = videoElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.log("Autoplay prevented:", e);
          });
        }
      }
    };

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [src, onLoaded, autoPlay]);

  return (
    <div className="basic-video-container" style={{
      display: 'block',
      width: '100%',
      height: '70vh',
      position: 'relative',
      backgroundColor: 'black',
      overflow: 'hidden'
    }}>
      <video
        ref={internalVideoRef}
        src={src}
        controls={controls}
        muted={muted}
        loop={loop}
        playsInline
        className={`basic-video-player ${className}`}
        style={{
          display: 'block',
          width: '100%',
          height: '70vh',
          objectFit: 'cover',
          backgroundColor: 'black'
        }}
      />
    </div>
  );
});

export default BasicVideoPlayer;
