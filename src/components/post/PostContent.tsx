
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Gamepad2 } from 'lucide-react';

interface PostContentProps {
  imageUrl?: string | null;
  videoUrl?: string | null;
  postId: string;
}

const PostContent = ({ imageUrl, videoUrl, postId }: PostContentProps) => {
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [isMediaError, setIsMediaError] = useState(false);

  // Debug logging for postId
  React.useEffect(() => {
    console.log(`PostContent rendering for postId: ${postId}`);
  }, [postId]);

  const handleMediaLoad = () => {
    setIsMediaLoaded(true);
  };

  const handleMediaError = () => {
    setIsMediaError(true);
    toast.error("Failed to load media");
  };

  const handlePlayError = (error: any) => {
    console.error("Video playback error:", error);
    setIsMediaError(true);
    toast.error("Failed to play video");
  };

  if (!imageUrl && !videoUrl) {
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
        <video
          src={videoUrl}
          className="w-full aspect-video object-cover bg-black"
          controls
          onLoadedData={handleMediaLoad}
          onError={handleMediaError}
          onPlay={(e) => {
            try {
              e.currentTarget.play().catch(handlePlayError);
            } catch (error) {
              handlePlayError(error);
            }
          }}
        />
      ) : imageUrl ? (
        <img
          src={imageUrl}
          alt="Post content"
          className="w-full object-cover bg-black"
          onLoad={handleMediaLoad}
          onError={handleMediaError}
        />
      ) : null}

      {/* Loading State */}
      {!isMediaLoaded && !isMediaError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-pulse rounded-full h-12 w-12 border-2 border-purple-500 border-t-transparent animate-spin"></div>
        </div>
      )}

      {/* Error State */}
      {isMediaError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Badge variant="destructive">Failed to load media</Badge>
        </div>
      )}
    </div>
  );
};

export default PostContent;
