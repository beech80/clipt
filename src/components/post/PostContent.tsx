import { useState, useEffect } from "react";
import { getOptimizedImageUrl, preloadImage, getVideoThumbnail } from "@/utils/mediaOptimization";
import { Skeleton } from "@/components/ui/skeleton";

interface PostContentProps {
  imageUrl?: string | null;
  videoUrl?: string | null;
  postId: string;
}

const PostContent = ({ imageUrl, videoUrl, postId }: PostContentProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [videoThumbnail, setVideoThumbnail] = useState<string>('');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    const loadMedia = async () => {
      try {
        if (imageUrl) {
          const optimizedUrl = getOptimizedImageUrl(imageUrl, {
            width: 1080,
            quality: 80,
            format: 'webp'
          });
          await preloadImage(optimizedUrl);
        } else if (videoUrl && !videoThumbnail) {
          const thumbnail = await getVideoThumbnail(videoUrl);
          setVideoThumbnail(thumbnail);
        }
      } catch (error) {
        console.error('Error loading media:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMedia();
  }, [imageUrl, videoUrl, videoThumbnail]);

  const handleVideoIntersection = (entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const video = entry.target as HTMLVideoElement;
        video.play().catch(console.error);
        setIsVideoPlaying(true);
      } else {
        const video = entry.target as HTMLVideoElement;
        video.pause();
        setIsVideoPlaying(false);
      }
    });
  };

  useEffect(() => {
    const videoElement = document.querySelector(`#video-${postId}`);
    if (!videoElement) return;

    const observer = new IntersectionObserver(handleVideoIntersection, {
      threshold: 0.5
    });

    observer.observe(videoElement);

    return () => {
      observer.disconnect();
    };
  }, [postId]);

  if (isLoading) {
    return <Skeleton className="w-full h-full" />;
  }

  if (imageUrl) {
    return (
      <img
        src={getOptimizedImageUrl(imageUrl, {
          width: 1080,
          quality: 80,
          format: 'webp'
        })}
        alt="Post content"
        className="w-full h-full object-cover"
        loading="lazy"
      />
    );
  }

  if (videoUrl) {
    return (
      <div className="relative w-full h-full">
        <video
          id={`video-${postId}`}
          src={videoUrl}
          className="w-full h-full object-cover"
          loop
          muted
          playsInline
          poster={videoThumbnail}
          preload="metadata"
        />
        {!isVideoPlaying && videoThumbnail && (
          <div className="absolute inset-0">
            <img
              src={videoThumbnail}
              alt="Video thumbnail"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default PostContent;