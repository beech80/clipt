import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Twitter, Facebook, Link, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface ShareToSocialProps {
  postId: string;
  content: string;
}

const ShareToSocial = ({ postId, content }: ShareToSocialProps) => {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async (platform: string) => {
    setIsSharing(true);
    const url = window.location.origin + `/post/${postId}`;
    const text = content.length > 100 ? content.substring(0, 97) + "..." : content;

    try {
      // Update analytics
      await supabase
        .from('post_analytics')
        .upsert({ 
          post_id: postId,
          shares_count: 1
        }, { 
          onConflict: 'post_id',
          count: 'shares_count'
        });

      switch (platform) {
        case 'twitter':
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
            '_blank'
          );
          break;
        case 'facebook':
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            '_blank'
          );
          break;
        case 'copy':
          await navigator.clipboard.writeText(url);
          toast.success("Link copied to clipboard!");
          break;
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error("Failed to share post");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          disabled={isSharing}
          className="flex items-center gap-2"
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleShare('twitter')}>
          <Twitter className="w-4 h-4 mr-2" />
          Share on Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('facebook')}>
          <Facebook className="w-4 h-4 mr-2" />
          Share on Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('copy')}>
          <Copy className="w-4 h-4 mr-2" />
          Copy Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShareToSocial;