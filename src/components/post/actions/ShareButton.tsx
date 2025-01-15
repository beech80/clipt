import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

const ShareButton = () => {
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  return (
    <button 
      className="p-2 hover:scale-110 transition-transform"
      onClick={handleShare}
    >
      <Share2 className="w-8 h-8 text-white" />
      <span className="text-xs text-white mt-1">Share</span>
    </button>
  );
};

export default ShareButton;