import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import VideoProxy from '../post/VideoProxy';
import { Bookmark } from 'lucide-react';
import { saveClipt } from '@/lib/savedClipts';
import { useAuth } from '@/contexts/AuthContext';

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
  onClick?: (e: React.MouseEvent) => void;
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
  onClick,
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
  const [showPlayButton, setShowPlayButton] = useState(false);

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

  // Auto-play when user interacts with the page
  useEffect(() => {
    const handleUserInteraction = () => {
      console.log('User interaction detected, trying to play video');
      if (videoRef.current && videoRef.current.paused) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log('Auto-play still blocked after user interaction:', error);
            // Add a play button overlay if autoplay fails
            setShowPlayButton(true);
          });
        }
      }
    };

    // Try to autoplay immediately
    if (videoRef.current && autoPlay) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Initial auto-play blocked:', error);
          setShowPlayButton(true);
        });
      }
    }

    // Listen for custom user-interacted event
    document.addEventListener('user-interacted', handleUserInteraction);
    
    // Listen for visibility changes (when tab becomes visible again)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && videoRef.current && autoPlay) {
        videoRef.current.play().catch(() => {});
      }
    });
    
    return () => {
      document.removeEventListener('user-interacted', handleUserInteraction);
      document.removeEventListener('visibilitychange', handleUserInteraction);
    };
  }, [autoPlay]);

  // Handle video load success
  const handleLoadSuccess = () => {
    console.log('Video loaded successfully');
    setIsLoaded(true);
    if (onLoad) onLoad();
    
    // Add user interaction flag for autoplay
    document.documentElement.setAttribute('data-user-interacted', 'true');
    
    // Force play for mobile devices which sometimes need user interaction
    if (videoRef.current && autoPlay) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Auto-play prevented. User interaction needed:', error);
          // We'll leave the video controls visible for manual play
        });
      }
    }
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
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
            <div className="animate-pulse">Loading video...</div>
          </div>
        )}
      </div>
    );
  }

  // Render HTML5 video with multiple sources
  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
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
        style={{ 
          display: 'block', 
          maxWidth: '100%', 
          width: '100%', 
          height: '100%', 
          objectFit: 'contain',
          visibility: 'visible' /* Ensure video is visible */,
          cursor: onClick ? 'pointer' : 'default',
          borderRadius: '0.75rem' /* Add rounded corners to the video itself */
        }}
        onLoadedData={handleLoadSuccess}
        onCanPlay={handleLoadSuccess}
        onPlay={() => setShowPlayButton(false)}
        onClick={onClick}
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

      {/* Loading indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
          <div className="animate-pulse">Loading video...</div>
        </div>
      )}
      
      {/* Manual play button overlay for browsers that block autoplay */}
      {showPlayButton && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer z-10 rounded-lg"
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
      
      {/* Save button */}
      {postId && (
        <SaveButton postId={postId} videoUrl={videoUrl} />
      )}
    </div>
  );
};

// Save Button Component for saving clipts
const SaveButton = ({ postId, videoUrl }: { postId: string, videoUrl: string }) => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent video click
    
    if (!user) {
      toast("Sign in to save clipts", {
        description: "Create an account to save your favorite clipts",
        action: {
          label: "Sign In",
          onClick: () => window.location.href = "/login"
        }
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Extract thumbnail from video if possible
      let thumbnailUrl = videoUrl;
      if (videoUrl.endsWith('.mp4')) {
        thumbnailUrl = videoUrl.replace('.mp4', '.jpg');
      }
      
      await saveClipt(user.id, postId, thumbnailUrl, videoUrl);
    } catch (error) {
      console.error('Error saving clipt:', error);
      toast.error('Failed to save clipt');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div 
      className="absolute top-2 right-2 z-20 p-1.5 bg-black/50 backdrop-blur-sm rounded-full cursor-pointer"
      onClick={handleSave}
    >
      <Bookmark 
        className={`w-5 h-5 ${isSaving ? 'text-purple-300 animate-pulse' : 'text-white'}`} 
        fill={isSaving ? "#d8b4fe" : "none"}
      />
    </div>
  );
};

export default FallbackVideoPlayer;
