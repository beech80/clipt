import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { handleVideoControl } from '../gameboy/VideoControls';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [lastTap, setLastTap] = useState(0);
  const { user } = useAuth();
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);

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

        // Reset like animation after delay
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
            className="w-full h-full object-cover"
            playsInline
            loop
            muted={isMuted}
            onClick={handleVideoClick}
          />
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
        <img
          src={imageUrl}
          alt="Post content"
          className="w-full h-full object-cover"
        />
      ) : null}
      
      {/* Double tap like animation */}
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
          <p className="text-sm">{content}</p>
        </div>
      )}
    </div>
  );
};

export default PostContent;