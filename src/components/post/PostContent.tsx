import { useState, useEffect, lazy, Suspense } from "react";
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
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          setIsIntersecting(entry.isIntersecting);
        });
      },
      { 
        threshold: 0.1,
        rootMargin: '50px 0px' // Preload when within 50px of viewport
      }
    );

    const element = document.querySelector(`#post-content-${postId}`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [postId]);

  useEffect(() => {
    const loadMedia = async () => {
      if (!isIntersecting) return;

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
  }, [imageUrl, videoUrl, videoThumbnail, isIntersecting]);

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

  return (
    <div id={`post-content-${postId}`} className="w-full h-full">
      {imageUrl && isIntersecting && (
        <img
          src={getOptimizedImageUrl(imageUrl, {
            width: 1080,
            quality: 80,
            format: 'webp'
          })}
          alt="Post content"
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      )}

      {videoUrl && (
        <div className="relative w-full h-full">
          <video
            id={`video-${postId}`}
            src={isIntersecting ? videoUrl : undefined}
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
                loading="lazy"
                decoding="async"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostContent;