import { Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { shareClipt } from '@/native/app/share';

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
  const handleShare = async () => {
    try {
      const result = await shareClipt({ title, text, url });
      toast.success(result === 'shared' ? 'Successfully shared!' : 'Link copied to clipboard!');
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
