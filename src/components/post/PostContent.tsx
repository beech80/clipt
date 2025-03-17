import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Gamepad2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PhotoCollage from './PhotoCollage';

interface PostContentProps {
  imageUrl?: string | null;
  videoUrl?: string | null;
  postId: string;
}

const PostContent = ({ imageUrl, videoUrl, postId }: PostContentProps) => {
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [isMediaError, setIsMediaError] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hasMultipleImages, setHasMultipleImages] = useState(false);
  const [showFullscreenGallery, setShowFullscreenGallery] = useState(false);

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
    // Remove debug logging to keep things clean
  }, [postId]);

  const handleMediaLoad = () => {
    setIsMediaLoaded(true);
    setIsMediaError(false);
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const target = e.target as HTMLVideoElement;
    console.error("Video error:", target.error?.message || "Unknown error", "Code:", target.error?.code);
    
    // Attempt video recovery on specific errors
    if (target.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
      console.log("Source not supported, may be MIME type issue. Attempting recovery...");
    }
    
    setIsMediaError(true);
    setIsMediaLoaded(false);
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
    <div className="relative">
      {/* Media Content */}
      {videoUrl ? (
        <div className="relative w-full h-full aspect-video bg-black">
          {isMediaError ? (
            <div className="absolute inset-0 flex items-center justify-center text-red-500">
              <div className="text-center p-4">
                <p>Unable to play video.</p>
                <button 
                  onClick={() => {
                    setIsMediaError(false);
                    setIsMediaLoaded(false);
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
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="animate-pulse text-white">Loading video...</div>
                </div>
              )}
              
              {/* Direct video with src attribute for better playback */}
              <video
                key={`video-${postId}`}
                src={videoUrl}
                className="w-full h-full object-contain"
                controls
                playsInline
                autoPlay
                muted
                loop
                preload="auto"
                onLoadedData={(e) => {
                  console.log("Video loaded successfully:", videoUrl);
                  handleMediaLoad();
                  // Unmute if interaction has occurred on the page
                  if (document.documentElement.hasAttribute('data-user-interacted')) {
                    const video = e.target as HTMLVideoElement;
                    video.muted = false;
                  }
                }}
                onError={(e) => {
                  console.error("Video error:", (e.target as HTMLVideoElement).error);
                  handleVideoError(e);
                }}
                onContextMenu={(e) => e.preventDefault()}
              />
              
              {/* Manual play button overlay */}
              {!isMediaLoaded && (
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
                  onClick={() => {
                    document.documentElement.setAttribute('data-user-interacted', 'true');
                    const video = document.querySelector(`video[key="video-${postId}"]`) as HTMLVideoElement;
                    if (video) {
                      video.muted = false;
                      video.play().catch(err => {
                        console.error("Manual play failed:", err);
                        // If manual play fails, try again muted
                        video.muted = true;
                        video.play().catch(() => setIsMediaError(true));
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
            className="w-full aspect-video object-cover bg-black"
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
