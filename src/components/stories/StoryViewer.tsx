import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { toast } from "sonner";

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  text_content?: string;
  background_color?: string;
  font_style?: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

interface StoryViewerProps {
  stories: Story[];
  onClose: () => void;
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export const StoryViewer = ({ stories, onClose, currentIndex, onIndexChange }: StoryViewerProps) => {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { user } = useAuth();
  const story = stories[currentIndex];
  const duration = story?.media_type === 'video' ? 30 : 5; // 30s for videos, 5s for images

  useEffect(() => {
    if (!story) return;

    let startTime = Date.now();
    let animationFrame: number;

    const animate = () => {
      if (isPaused) {
        startTime = Date.now() - (progress / 100) * duration * 1000;
        return;
      }

      const elapsedTime = Date.now() - startTime;
      const newProgress = (elapsedTime / (duration * 1000)) * 100;

      if (newProgress >= 100) {
        if (currentIndex < stories.length - 1) {
          onIndexChange(currentIndex + 1);
        } else {
          onClose();
        }
        return;
      }

      setProgress(newProgress);
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    // Record view
    if (user) {
      supabase
        .from('story_views')
        .insert([{ story_id: story.id, viewer_id: user.id }])
        .single();
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [story, currentIndex, isPaused]);

  if (!story) return null;

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      onIndexChange(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="absolute top-0 w-full p-4">
        <Progress value={progress} className="h-1" />
      </div>

      <div className="absolute top-4 left-4 flex items-center space-x-2 text-white">
        <img
          src={story.profiles.avatar_url || '/placeholder.svg'}
          alt={story.profiles.username}
          className="w-8 h-8 rounded-full"
        />
        <span>{story.profiles.username}</span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-white"
        onClick={onClose}
      >
        ✕
      </Button>

      <div className="relative w-full max-w-lg mx-auto aspect-[9/16]">
        {story.media_type === 'video' ? (
          <video
            src={story.media_url}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
            onPause={() => setIsPaused(true)}
            onPlay={() => setIsPaused(false)}
          />
        ) : (
          <img
            src={story.media_url}
            alt="Story content"
            className="w-full h-full object-cover"
          />
        )}

        {story.text_content && (
          <div
            className="absolute inset-0 flex items-center justify-center p-4 text-white text-center"
            style={{
              backgroundColor: story.background_color || 'rgba(0,0,0,0.3)',
              fontFamily: story.font_style || 'inherit'
            }}
          >
            <p className="text-xl">{story.text_content}</p>
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white"
        onClick={handlePrevious}
        disabled={currentIndex === 0}
      >
        <ChevronLeft className="h-8 w-8" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white"
        onClick={handleNext}
      >
        <ChevronRight className="h-8 w-8" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white"
        onClick={() => setIsPaused(!isPaused)}
      >
        {isPaused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
      </Button>
    </div>
  );
};