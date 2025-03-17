import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import VideoProxy from '../post/VideoProxy';

interface FallbackVideoPlayerProps {
  videoUrl: string;
  postId?: string;
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
  muted?: boolean;
  loop?: boolean;
}

const videoTypes = [
  { type: 'video/mp4', extension: '.mp4' },
  { type: 'video/webm', extension: '.webm' },
  { type: 'video/ogg', extension: '.ogv' },
  { type: 'application/x-mpegURL', extension: '.m3u8' },
];

/**
 * FallbackVideoPlayer component that tries multiple approaches to play a video
 * 1. First tries with HTML5 video element with multiple source types
 * 2. Falls back to VideoProxy if HTML5 video fails
 * 3. Falls back to iframe if VideoProxy fails
 * 4. Shows error state with retry button if all approaches fail
 */
const FallbackVideoPlayer: React.FC<FallbackVideoPlayerProps> = ({
  videoUrl,
  postId,
  onLoad,
  onError,
  className = 'w-full h-full object-contain',
  autoPlay = true,
  controls = true,
  muted = true,
  loop = true,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(videoUrl);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  const [useProxyFallback, setUseProxyFallback] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [attemptCount, setAttemptCount] = useState(0);

  // Debug log on initial render
  useEffect(() => {
    console.log(`FallbackVideoPlayer: Attempting to play ${videoUrl} for post ${postId || 'unknown'}`);
  }, [videoUrl, postId]);

  // Reset state when video URL changes
  useEffect(() => {
    setIsLoaded(false);
    setIsError(false);
    setCurrentUrl(videoUrl);
    setFallbackIndex(0);
    setUseIframeFallback(false);
    setUseProxyFallback(false);
    setAttemptCount(0);
  }, [videoUrl]);

  // Handle video load success
  const handleLoadSuccess = () => {
    console.log(`Video loaded successfully: ${currentUrl}`);
    setIsLoaded(true);
    setIsError(false);
    if (onLoad) onLoad();
  };

  // Try next fallback approach when current one fails
  const tryNextFallback = () => {
    if (fallbackIndex < videoTypes.length - 1 && !useIframeFallback && !useProxyFallback) {
      // Try next video format
      setFallbackIndex(prevIndex => prevIndex + 1);
    } else if (!useProxyFallback && !useIframeFallback) {
      // Try proxy approach first
      console.log('Trying VideoProxy fallback');
      setUseProxyFallback(true);
    } else if (!useIframeFallback) {
      // Try iframe approach next
      console.log('Trying iframe fallback');
      setUseIframeFallback(true);
    } else {
      // All approaches failed
      console.error(`All video playback approaches failed for ${videoUrl}`);
      setIsError(true);
      if (onError) onError();
    }
    
    setAttemptCount(prev => prev + 1);
  };

  // Test if URL is accessible
  const testUrl = async (url: string) => {
    try {
      // Just check if the URL is reachable
      const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      return true;
    } catch (error) {
      console.error(`URL test failed for ${url}:`, error);
      return false;
    }
  };

  // Retry from the beginning
  const retryFromStart = async () => {
    console.log('Retrying video playback from start');
    setIsError(false);
    setIsLoaded(false);
    setFallbackIndex(0);
    setUseIframeFallback(false);
    setUseProxyFallback(false);
    
    // Force cache-busting
    const hasParams = videoUrl.includes('?');
    const cacheBuster = `${hasParams ? '&' : '?'}t=${Date.now()}`;
    setCurrentUrl(videoUrl + cacheBuster);
    
    setAttemptCount(0);
  };

  // Derive source URL based on current fallback strategy
  const getSourceUrls = () => {
    const baseUrl = currentUrl.split('?')[0]; // Remove any query params
    
    // Try to infer base without extension if there is one
    let baseWithoutExt = baseUrl;
    const lastDotIndex = baseUrl.lastIndexOf('.');
    if (lastDotIndex > baseUrl.lastIndexOf('/')) {
      baseWithoutExt = baseUrl.substring(0, lastDotIndex);
    }
    
    // Generate URLs for all supported video types
    return videoTypes.map(videoType => ({
      url: baseWithoutExt + videoType.extension,
      type: videoType.type
    }));
  };

  // If error state, show retry button
  if (isError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black/20 p-4 rounded">
        <p className="text-red-500 mb-2">Unable to play video</p>
        <button
          onClick={retryFromStart}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
        >
          Retry
        </button>
        <p className="mt-4 text-xs text-gray-400">{currentUrl}</p>
      </div>
    );
  }

  // Render VideoProxy fallback
  if (useProxyFallback) {
    return (
      <VideoProxy
        src={currentUrl}
        className={className}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline={true}
        onLoad={handleLoadSuccess}
        onError={tryNextFallback}
      />
    );
  }

  // Render iframe fallback
  if (useIframeFallback) {
    return (
      <div className="relative w-full h-full">
        <iframe
          ref={iframeRef}
          src={currentUrl}
          className={className}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={handleLoadSuccess}
          onError={tryNextFallback}
        />
        
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="animate-pulse">Loading video...</div>
          </div>
        )}
      </div>
    );
  }

  // Render HTML5 video with multiple sources
  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        className={className}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline
        preload="auto"
        key={`video-${postId}-${attemptCount}`}
        onLoadedData={handleLoadSuccess}
        onError={() => {
          console.error(`Video error for attempt ${attemptCount}`);
          tryNextFallback();
        }}
      >
        {getSourceUrls().map((source, index) => (
          <source key={index} src={source.url} type={source.type} />
        ))}
        <p>
          Your browser doesn't support HTML5 video.
          <a href={videoUrl} target="_blank" rel="noopener noreferrer">
            Download the video
          </a>.
        </p>
      </video>

      {!isLoaded && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
          onClick={() => {
            document.documentElement.setAttribute('data-user-interacted', 'true');
            if (videoRef.current) {
              videoRef.current.muted = false;
              videoRef.current.load();
              videoRef.current.play().catch(err => {
                console.error("Manual play failed:", err);
                // Try again muted
                if (videoRef.current) {
                  videoRef.current.muted = true;
                  videoRef.current.play().catch(() => {
                    console.error("Even muted playback failed");
                    tryNextFallback();
                  });
                }
              });
            }
          }}
        >
          <div className="p-4 bg-purple-800/80 rounded-full hover:bg-purple-700/80 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default FallbackVideoPlayer;
