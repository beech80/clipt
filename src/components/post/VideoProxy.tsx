import React, { useEffect, useState, useRef } from 'react';

interface VideoProxyProps {
  src: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  onError?: () => void;
  onLoad?: () => void;
}

/**
 * VideoProxy component that handles proxying video content to bypass CORS and MIME type issues
 * Includes fallbacks for video loading failures
 */
const VideoProxy: React.FC<VideoProxyProps> = ({
  src,
  className = '',
  controls = true,
  autoPlay = true,
  muted = true,
  loop = true,
  playsInline = true,
  onError,
  onLoad,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch and create a blob URL from the source
  useEffect(() => {
    if (!src) {
      setError('No video source provided');
      setIsLoading(false);
      if (onError) onError();
      return;
    }

    let isMounted = true;
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchVideo = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log(`VideoProxy: Fetching video from ${src}`);
        
        // Try with no-cors mode first to handle CORS issues
        const response = await fetch(src, { 
          signal,
          mode: 'no-cors',
          cache: 'no-store' 
        });
        
        if (!isMounted) return;
        
        // Create a blob URL from the response
        const blob = await response.blob();
        
        if (!isMounted) return;
        
        // Determine MIME type - either from response or infer from extension
        let mimeType = response.headers.get('content-type');
        if (!mimeType || mimeType === 'text/plain' || mimeType === 'application/octet-stream') {
          // Infer from extension
          if (src.toLowerCase().endsWith('.mp4')) {
            mimeType = 'video/mp4';
          } else if (src.toLowerCase().endsWith('.webm')) {
            mimeType = 'video/webm';
          } else if (src.toLowerCase().endsWith('.m3u8')) {
            mimeType = 'application/x-mpegURL';
          } else {
            // Default to mp4
            mimeType = 'video/mp4';
          }
        }
        
        // Create a new blob with the correct MIME type
        const videoBlob = new Blob([blob], { type: mimeType });
        const url = URL.createObjectURL(videoBlob);
        
        console.log(`VideoProxy: Created blob URL for ${src} with MIME type ${mimeType}`);
        
        setBlobUrl(url);
        setIsLoading(false);
        if (onLoad) onLoad();
      } catch (err) {
        if (!isMounted) return;
        
        console.error('Error fetching video:', err);
        setError(`Failed to load video: ${err instanceof Error ? err.message : String(err)}`);
        setIsLoading(false);
        
        // Retry up to 3 times with increasing delays
        if (retryCount < 3) {
          const delay = 1000 * (retryCount + 1);
          console.log(`VideoProxy: Retrying in ${delay}ms (attempt ${retryCount + 1}/3)`);
          
          setTimeout(() => {
            if (isMounted) {
              setRetryCount(prev => prev + 1);
            }
          }, delay);
        } else if (onError) {
          onError();
        }
      }
    };

    fetchVideo();

    return () => {
      isMounted = false;
      controller.abort();
      
      // Clean up blob URL when component unmounts
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [src, retryCount, onError, onLoad]);

  // Handle retry button click
  const retryFetch = () => {
    setRetryCount(0); // This will trigger the useEffect to run again
  };

  // Add autoplay support with user interaction listeners
  useEffect(() => {
    const handleUserInteraction = () => {
      console.log('User interaction detected in VideoProxy');
      if (videoRef.current && videoRef.current.paused) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log('Auto-play still blocked in VideoProxy:', error);
            setShowPlayButton(true);
          });
        }
      }
    };

    document.addEventListener('user-interacted', handleUserInteraction);
    
    // Try to autoplay on interval
    const intervalId = setInterval(() => {
      if (videoRef.current && videoRef.current.paused && autoPlay && !isLoading) {
        videoRef.current.play().catch(() => {
          setShowPlayButton(true);
        });
      }
    }, 2000);
    
    return () => {
      document.removeEventListener('user-interacted', handleUserInteraction);
      clearInterval(intervalId);
    };
  }, [autoPlay, isLoading]);

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <p className="text-white animate-pulse">Loading video...</p>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 p-4 z-10">
          <p className="text-red-500">{error}</p>
          <button 
            onClick={retryFetch} 
            className="mt-2 px-2 py-1 bg-purple-700 rounded text-white text-xs"
          >
            Retry
          </button>
        </div>
      )}
      
      {blobUrl && (
        <video
          ref={videoRef}
          src={blobUrl}
          className={className}
          controls={controls}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          playsInline={playsInline}
          onError={() => {
            console.error('Video element error in VideoProxy');
            if (onError) onError();
          }}
          onLoadedData={() => {
            setIsLoading(false);
            if (onLoad) onLoad();
            // Force play for mobile devices which sometimes need user interaction
            if (videoRef.current && autoPlay) {
              const playPromise = videoRef.current.play();
              if (playPromise !== undefined) {
                playPromise.then(() => {
                  setShowPlayButton(false);
                }).catch(err => {
                  console.log('Auto-play prevented in VideoProxy. User interaction needed:', err);
                  setShowPlayButton(true);
                });
              }
            }
          }}
          onPlay={() => setShowPlayButton(false)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', maxHeight: '90vh' }}
        />
      )}
      
      {/* Manual play button overlay for browsers that block autoplay */}
      {showPlayButton && !isLoading && blobUrl && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer z-10"
          onClick={() => {
            if (videoRef.current) {
              videoRef.current.play()
                .then(() => setShowPlayButton(false))
                .catch(err => console.error("Manual play failed:", err));
            }
          }}
        >
          <div className="bg-purple-700/80 p-4 rounded-full hover:bg-purple-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoProxy;
