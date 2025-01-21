import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, Heart, MessageCircle, Share } from 'lucide-react';
import { toast } from 'sonner';

interface Story {
  id: string;
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
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

export const StoryViewer = ({
  stories,
  currentIndex,
  onIndexChange,
  onClose
}: StoryViewerProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (progress < 100) {
        setProgress(prev => prev + 1);
      } else {
        if (currentIndex < stories.length - 1) {
          onIndexChange(currentIndex + 1);
          setProgress(0);
        } else {
          onClose();
        }
      }
    }, 30);

    return () => clearInterval(timer);
  }, [progress, currentIndex, stories.length, onIndexChange, onClose]);

  const currentStory = stories[currentIndex];

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      onIndexChange(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
      setProgress(0);
    }
  };

  const handleInteraction = (type: 'like' | 'comment' | 'share') => {
    const actions = {
      like: 'Liked',
      comment: 'Commented on',
      share: 'Shared'
    };
    toast.success(`${actions[type]} the story!`);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div className="absolute top-0 w-full h-1 bg-gray-800">
        <div 
          className="h-full bg-gaming-400 transition-all duration-300 animate-power-pulse"
          style={{ width: `${progress}%` }}
        />
      </div>

      <button
        onClick={handlePrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors"
        disabled={currentIndex === 0}
      >
        <ChevronLeft className="w-8 h-8" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors"
        disabled={currentIndex === stories.length - 1}
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStory.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.2 }}
          transition={{ duration: 0.3 }}
          className="relative max-w-lg w-full aspect-[9/16] rounded-lg overflow-hidden"
        >
          <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
            <Avatar className="border-2 border-gaming-400 animate-glow">
              <AvatarImage src={currentStory.profiles.avatar_url} />
              <AvatarFallback>{currentStory.profiles.username[0]}</AvatarFallback>
            </Avatar>
            <span className="text-white font-medium">{currentStory.profiles.username}</span>
          </div>

          {currentStory.media_type === 'video' ? (
            <video
              src={currentStory.media_url}
              className="w-full h-full object-cover animate-game-fade"
              autoPlay
              muted
              loop
            />
          ) : (
            <img
              src={currentStory.media_url}
              alt="Story"
              className="w-full h-full object-cover animate-game-fade"
            />
          )}

          {currentStory.text_content && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute bottom-20 left-4 right-4 text-white text-lg font-medium"
              style={{
                backgroundColor: currentStory.background_color || 'rgba(0,0,0,0.5)',
                fontFamily: currentStory.font_style || 'inherit',
                padding: '1rem',
                borderRadius: '0.5rem'
              }}
            >
              {currentStory.text_content}
            </motion.div>
          )}

          <div className="absolute bottom-4 left-4 right-4 flex justify-around">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => handleInteraction('like')}
            >
              <Heart className="w-6 h-6 animate-emote-float" />
            </Button>
            <Button
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => handleInteraction('comment')}
            >
              <MessageCircle className="w-6 h-6 animate-emote-float" />
            </Button>
            <Button
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => handleInteraction('share')}
            >
              <Share className="w-6 h-6 animate-emote-float" />
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};