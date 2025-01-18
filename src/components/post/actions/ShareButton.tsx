import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { track_post_analytics } from "@/services/postService";

interface ShareButtonProps {
  postId: string;
}

const ShareButton = ({ postId }: ShareButtonProps) => {
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/post/${postId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this post',
          text: 'I found this interesting post',
          url: shareUrl,
        });
        toast.success("Post shared successfully!");
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          // Only copy to clipboard if share was not aborted
          await copyToClipboard(shareUrl);
        }
      }
    } else {
      await copyToClipboard(shareUrl);
    }

    // Track share analytics
    try {
      await track_post_analytics(postId, 'share');
    } catch (error) {
      console.error('Error tracking share:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error("Failed to copy link");
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleShare}
      className="flex items-center gap-2"
    >
      <Share2 className="w-4 h-4" />
    </Button>
  );
};

export default ShareButton;