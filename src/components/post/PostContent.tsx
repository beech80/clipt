
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Play, Pause, Volume2, VolumeX, Heart } from "lucide-react";

export interface PostContentProps {
  videoUrl?: string | null;
  imageUrl?: string | null;
  postId?: string;
  onLike?: () => void;
}

const PostContent: React.FC<PostContentProps> = ({ videoUrl, imageUrl, onLike }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoClick = () => {
    togglePlay();
  };

  const handleDoubleTap = () => {
    if (onLike) {
      onLike();
      setShowLikeAnimation(true);
      setTimeout(() => setShowLikeAnimation(false), 1000);
    }
  };

  useEffect(() => {
    const updateProgress = () => {
      if (videoRef.current) {
        const currentTime = videoRef.current.currentTime;
        const duration = videoRef.current.duration;
        setProgress((currentTime / duration) * 100);
      }
    };

    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.addEventListener("timeupdate", updateProgress);
    }

    return () => {
      if (videoElement) {
        videoElement.removeEventListener("timeupdate", updateProgress);
      }
    };
  }, [videoRef]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full bg-black"
      onDoubleClick={handleDoubleTap}
    >
      {videoUrl ? (
        <>
          <video
            ref={videoRef}
            src={videoUrl}
            className={cn(
              "w-full h-auto max-h-[80vh] object-contain mx-auto",
              !isVideoLoaded && "invisible"
            )}
            playsInline
            loop
            muted={isMuted}
            onClick={handleVideoClick}
            onLoadedData={() => setIsVideoLoaded(true)}
          />
          {!isVideoLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <Progress value={progress} className="h-1 mb-4" />
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="text-white hover:text-white/80"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="text-white hover:text-white/80"
              >
                {isMuted ? (
                  <VolumeX className="h-6 w-6" />
                ) : (
                  <Volume2 className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </>
      ) : imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt="Post content"
            className={cn(
              "w-full h-auto max-h-[80vh] object-contain mx-auto",
              !isImageLoaded && "invisible"
            )}
            onLoad={() => setIsImageLoaded(true)}
            loading="lazy"
          />
          {!isImageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </>
      ) : null}
      
      {showLikeAnimation && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Heart className="text-red-500 h-24 w-24 animate-like" fill="currentColor" />
        </div>
      )}
    </div>
  );
};

export default PostContent;
