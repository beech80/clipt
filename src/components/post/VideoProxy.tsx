import React, { useEffect, useState } from 'react';

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
  const handleRetry = () => {
    setRetryCount(0); // This will trigger the useEffect to run again
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-black/20 ${className}`}>
        <div className="animate-pulse text-white">Loading video...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-black/20 p-4 ${className}`}>
        <p className="text-red-500 mb-2 text-sm">{error}</p>
        <button
          onClick={handleRetry}
          className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (blobUrl) {
    return (
      <video
        src={blobUrl}
        className={className}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        onError={() => {
          console.error('Video playback error from blob URL');
          setError('Video playback error');
          if (onError) onError();
        }}
      />
    );
  }

  // Fallback to direct video tag if blob creation failed
  return (
    <video
      src={src}
      className={className}
      controls={controls}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      playsInline={playsInline}
      onError={() => {
        console.error('Direct video playback error');
        setError('Video playback error');
        if (onError) onError();
      }}
    />
  );
};

export default VideoProxy;
