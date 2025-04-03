import React, { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Gamepad2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PhotoCollage from './PhotoCollage';
import { debugVideoElement } from '@/utils/debugVideos';
import FallbackVideoPlayer from '../video/FallbackVideoPlayer';

interface PostContentProps {
  imageUrl?: string | null;
  videoUrl?: string | null;
  postId: string;
  compact?: boolean;
  isCliptsPage?: boolean;
}

const PostContent = ({ imageUrl, videoUrl, postId, compact = false, isCliptsPage = false }: PostContentProps) => {
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [isMediaError, setIsMediaError] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hasMultipleImages, setHasMultipleImages] = useState(false);
  const [showFullscreenGallery, setShowFullscreenGallery] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch multiple images if available
  useEffect(() => {
    const fetchImagesUrls = async () => {
      if (postId) {
        const { data, error } = await supabase
          .from('posts')
          .select('image_url')
          .eq('id', postId)
          .single();
        
        if (error) {
          console.error("Error fetching image URLs:", error);
          return;
        }
        
        if (data && data.image_url) {
          // Check if it's a comma-separated string
          if (data.image_url.includes(',')) {
            const urls = data.image_url.split(',');
            setImageUrls(urls);
            setHasMultipleImages(urls.length > 1);
          } else {
            // Single image
            setImageUrls([data.image_url]);
            setHasMultipleImages(false);
          }
        } else if (imageUrl) {
          // Fallback to passed prop
          setImageUrls([imageUrl]);
          setHasMultipleImages(false);
        }
      }
    };
    
    fetchImagesUrls();
  }, [postId, imageUrl]);

  // Debug logging for postId
  useEffect(() => {
    if (videoUrl) {
      console.log(`PostContent: Loading video for post ${postId} with URL: ${videoUrl}`);
    }
  }, [postId, videoUrl]);

  // Additional check for video URL
  useEffect(() => {
    if (videoUrl && !isMediaLoaded && !isMediaError) {
      // Run initial debugging on the video element
      debugVideoElement(videoUrl);
    }
  }, [videoUrl, isMediaLoaded, isMediaError]);

  useEffect(() => {
    // Check if the video needs to be manually started after loading
    if (videoRef.current && isMediaLoaded) {
      videoRef.current.play().catch(error => {
        console.log('Auto-play prevented in PostContent:', error);
      });
    }
  }, [isMediaLoaded]);

  useEffect(() => {
    const handleUserInteraction = () => {
      console.log('User interaction detected in PostContent, trying to play videos');
      // Find all video elements within this component's DOM tree
      document.querySelectorAll('video').forEach(video => {
        if (video.paused) {
          video.play().catch(() => {});
        }
      });
    };

    const handleScroll = () => {
      const videos = document.querySelectorAll('video');
      videos.forEach(video => {
        const rect = video.getBoundingClientRect();
        const isInViewport = (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
          rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
        
        if (isInViewport && video.paused) {
          video.play().catch(() => {});
        }
      });
    };

    document.addEventListener('user-interacted', handleUserInteraction);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      document.removeEventListener('user-interacted', handleUserInteraction);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleMediaLoad = () => {
    setIsMediaLoaded(true);
    setIsMediaError(false);
    // Reset retry count on successful load
    setRetryCount(0);
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const videoElement = e.target as HTMLVideoElement;
    const videoUrl = videoElement.src || 'Unknown URL';
    
    console.error(`Video error for post ${postId} with URL ${videoUrl}:`, {
      errorCode: videoElement.error?.code,
      errorMessage: videoElement.error?.message,
      networkState: videoElement.networkState,
      readyState: videoElement.readyState
    });
    
    // Try to diagnose the specific error
    let errorMessage = "Could not load video";
    
    if (videoElement.error) {
      switch (videoElement.error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = "Video playback was aborted";
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = "Network error while loading video";
          // Try with CORS disabled as a last resort
          if (videoElement.hasAttribute('crossorigin')) {
            console.log("Trying without CORS for URL:", videoUrl);
            videoElement.removeAttribute('crossorigin');
            videoElement.load();
            return; // Don't set error state yet, we're trying a fix
          }
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = "Video format error or corrupted video";
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = "Video format not supported by browser";
          break;
      }
    }
    
    // Output additional info to help debug
    if (videoUrl) {
      // Check if this is a CORS issue by testing with Image
      const img = new Image();
      img.onload = () => console.log("Image load test succeeded for video URL, might be a video format issue");
      img.onerror = () => console.error("Image load test also failed, likely a CORS or network issue");
      img.src = videoUrl;
    }
    
    setIsMediaError(true);
    toast.error(errorMessage);
  };

  const handleImageError = () => {
    console.error("Image failed to load");
    setIsMediaError(true);
    setIsMediaLoaded(false);
  };

  const handlePlayError = (error: any) => {
    console.error("Video playback error:", error);
    setIsMediaError(true);
    toast.error("Failed to play video");
  };

  const goToPreviousImage = () => {
    setCurrentImageIndex(prevIndex => 
      prevIndex === 0 ? imageUrls.length - 1 : prevIndex - 1
    );
  };

  const goToNextImage = () => {
    setCurrentImageIndex(prevIndex => 
      prevIndex === imageUrls.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handleCollageImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setShowFullscreenGallery(true);
  };

  if (!imageUrl && !videoUrl && imageUrls.length === 0) {
    return (
      <div className="w-full aspect-video bg-gray-900 flex items-center justify-center">
        <Gamepad2 className="h-12 w-12 text-gray-700" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Media Content */}
      {videoUrl ? (
        <div className={`relative w-full bg-black ${isCliptsPage ? 'h-screen' : 'h-full'}`} style={{ 
          aspectRatio: isCliptsPage ? 'unset' : '1/1', 
          maxHeight: isCliptsPage ? 'none' : (compact ? '360px' : '90vh'),
          display: 'block', 
          minHeight: isCliptsPage ? 'calc(100vh - 120px)' : (compact ? '360px' : '360px'),
          overflow: 'hidden',
          width: '100%'
        }}>
          {isMediaError ? (
            <div className="absolute inset-0 flex items-center justify-center text-red-500">
              <div className="text-center p-4">
                <p>Unable to play video.</p>
                <button 
                  onClick={() => {
                    setIsMediaError(false);
                    setIsMediaLoaded(false);
                    setRetryCount(prev => prev + 1); // Increment retry counter
                  }}
                  className="mt-2 px-2 py-1 bg-purple-700 rounded text-white text-xs"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <>
              {!isMediaLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                  <div className="animate-pulse text-white">Loading video...</div>
                </div>
              )}
              
              {/* FallbackVideoPlayer with enhanced error recovery */}
              <FallbackVideoPlayer
                videoUrl={videoUrl}
                postId={postId}
                onLoad={handleMediaLoad}
                onError={() => setIsMediaError(true)}
                className={`w-full h-full ${isCliptsPage ? 'object-cover' : 'object-cover md:object-contain'}`}
                autoPlay={true}
                controls={true}
                muted={false}
                loop={true}
              />
            </>
          )}
        </div>
      ) : imageUrls.length > 0 ? (
        showFullscreenGallery ? (
          // Full-screen gallery view for when an image is clicked
          <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
            <div className="flex justify-between items-center p-4">
              <span className="text-white">{currentImageIndex + 1} / {imageUrls.length}</span>
              <button 
                className="text-white"
                onClick={() => setShowFullscreenGallery(false)}
              >
                Close
              </button>
            </div>
            <div className="flex-1 relative">
              <img
                src={imageUrls[currentImageIndex]}
                alt="Post content fullscreen"
                className="max-h-[80vh] max-w-full object-contain mx-auto"
                onLoad={handleMediaLoad}
                onError={handleImageError}
              />
              
              {imageUrls.length > 1 && (
                <>
                  <button 
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 rounded-full p-3"
                    onClick={goToPreviousImage}
                  >
                    <ChevronLeft className="h-8 w-8 text-white" />
                  </button>
                  
                  <button 
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 rounded-full p-3"
                    onClick={goToNextImage}
                  >
                    <ChevronRight className="h-8 w-8 text-white" />
                  </button>
                </>
              )}
            </div>
          </div>
        ) : hasMultipleImages ? (
          // Photo collage for multiple images
          <PhotoCollage 
            images={imageUrls} 
            onImageClick={handleCollageImageClick}
          />
        ) : (
          // Single image view
          <img
            src={imageUrls[0]}
            alt="Post content"
            className={`w-full object-cover bg-black`}
            style={compact ? { 
              width: '100%', 
              height: '360px', /* Square aspect ratio */
              objectFit: 'cover'
            } : { aspectRatio: '1/1' }}
            onLoad={handleMediaLoad}
            onError={handleImageError}
            onClick={() => setShowFullscreenGallery(true)}
          />
        )
      ) : null}

      {/* Loading Indicator */}
      {!isMediaLoaded && !isMediaError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      )}

      {/* Error State */}
      {isMediaError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Badge variant="destructive" className="px-3 py-1">Media unavailable</Badge>
        </div>
      )}
    </div>
  );
};

export default PostContent;
