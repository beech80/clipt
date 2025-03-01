import { Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const ShareButton = ({ 
  title, 
  text, 
  url, 
  variant = 'outline', 
  size = 'sm',
  className = ''
}: ShareButtonProps) => {
  const [isSupported] = useState(() => {
    return typeof navigator !== 'undefined' && !!navigator.share;
  });

  const handleShare = async () => {
    try {
      if (isSupported) {
        await navigator.share({
          title,
          text,
          url,
        });
        toast.success('Successfully shared!');
      } else {
        // Fallback for browsers that don't support Web Share API
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast.error('Failed to share content');
        console.error('Error sharing content:', error);
      }
    }
  };

  return (
    <Button
      onClick={handleShare}
      variant={variant}
      size={size}
      className={className}
      aria-label="Share"
    >
      <Share className="h-4 w-4 mr-2" />
      Share
    </Button>
  );
};

export default ShareButton;
