import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Volume2, VolumeX, Play, Pause, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { handleVideoControl } from '../gameboy/VideoControls';
import { linkifyHashtags } from '@/utils/hashtagUtils';
import { linkifyMentions } from '@/utils/mentionUtils';

interface PostContentProps {
  content: string;
  imageUrl: string | null;
  videoUrl?: string | null;
  postId: string;
}

const PostContent = ({ content, imageUrl, videoUrl, postId }: PostContentProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [lastTap, setLastTap] = useState(0);
  const { user } = useAuth();
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && !video.paused) {
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.5 }
    );

    observerRef.current.observe(video);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const progress = (video.currentTime / video.duration) * 100;
      setProgress(progress);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, []);

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleDoubleTap = async () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      if (!user) {
        toast.error("Please login to like posts");
        return;
      }

      try {
        setShowLikeAnimation(true);
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (error) throw error;
        toast.success("Post liked!");

        setTimeout(() => {
          setShowLikeAnimation(false);
        }, 1000);
      } catch (error) {
        console.error("Error liking post:", error);
        toast.error("Failed to like post");
      }
    }
    
    setLastTap(now);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[calc(100vh-200px)] bg-black group"
      onClick={handleDoubleTap}
    >
      {videoUrl ? (
        <>
          <video
            ref={videoRef}
            src={videoUrl}
            className={cn(
              "w-full h-full object-cover",
              !isVideoLoaded && "invisible"
            )}
            playsInline
            loop
            muted={isMuted}
            onClick={handleVideoClick}
            onLoadedData={() => setIsVideoLoaded(true)}
            loading="lazy"
          />
          {!isVideoLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <Progress value={progress} className="h-1 mb-4" />
            <div className="flex items-center gap-4">
              <button
                onClick={handleVideoClick}
                className="text-white hover:text-gaming-400 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </button>
              <button
                onClick={toggleMute}
                className="text-white hover:text-gaming-400 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-6 h-6" />
                ) : (
                  <Volume2 className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </>
      ) : imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt="Post content"
            className={cn(
              "w-full h-full object-cover",
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
          <Heart className="w-24 h-24 text-red-500 animate-scale-up" />
        </div>
      )}

      <div className={cn(
        "absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50",
        content && "pb-16"
      )} />
      {content && (
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <p 
            className="text-sm"
            dangerouslySetInnerHTML={{ 
              __html: linkifyMentions(linkifyHashtags(content))
            }}
          />
        </div>
      )}
    </div>
  );
};

export default PostContent;