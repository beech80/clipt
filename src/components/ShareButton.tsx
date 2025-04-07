import React, { useState } from 'react';
import { Share2, Check, Copy, Twitter, Facebook, Link as LinkIcon, MessageCircle, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface ShareButtonProps {
  postId: string;
  className?: string;
  iconOnly?: boolean;
  iconClassName?: string;
  style?: React.CSSProperties;
}

const ShareButton: React.FC<ShareButtonProps> = ({ postId, className = '', iconOnly = false, iconClassName = '', style }) => {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Generate the link to share
  const getShareUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/post/${postId}`;
  };

  // Handle copy to clipboard
  const handleCopyLink = () => {
    const url = getShareUrl();
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        toast.error("Failed to copy link");
      });
  };

  // Handle social media shares
  const handleTwitterShare = () => {
    const url = getShareUrl();
    const text = "Check out this awesome Clipt!";
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank');
  };

  const handleFacebookShare = () => {
    const url = getShareUrl();
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank');
  };

  // Handle in-app sharing via messages
  const handleShareViaMessage = async () => {
    if (!user) {
      toast.error("You need to be logged in to send messages");
      return;
    }
    
    // Show a select recipient interface or open a dialog
    navigate('/messages?share=' + postId);
  };

  // Achievement tracking - update when a user shares content
  const trackShareAchievement = async () => {
    if (!user) return;
    
    try {
      // Record that this user shared a post
      await supabase
        .from('user_actions')
        .insert({
          user_id: user.id,
          action_type: 'share',
          target_id: postId,
          created_at: new Date().toISOString()
        });
      
      // This would ideally be handled by a backend function that checks achievements
      // For simplicity, we're directly incrementing here
      const { data: existingShares } = await supabase
        .from('user_actions')
        .select('count')
        .eq('user_id', user.id)
        .eq('action_type', 'share')
        .single();
      
      const shareCount = existingShares?.count || 1;
      
      // Check for achievements related to sharing
      if (shareCount === 10) {
        toast.success("Achievement Unlocked: Signal Booster!");
      } else if (shareCount === 1) {
        toast.success("First share recorded! Keep sharing to unlock achievements.");
      }
      
    } catch (error) {
      console.error("Error tracking share:", error);
    }
  };

  // Handle direct share using Web Share API if available
  const handleDirectShare = async () => {
    const shareUrl = getShareUrl();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this Clipt',
          text: 'You should check out this awesome Clipt!',
          url: shareUrl,
        });
        toast.success('Shared successfully');
        trackShareAchievement();
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback to dropdown menu if sharing fails
        document.getElementById('share-dropdown-trigger')?.click();
      }
    } else {
      // If Web Share API is not available, just open the dropdown
      document.getElementById('share-dropdown-trigger')?.click();
    }
  };

  return (
    <div className={className} style={style}>
      <DropdownMenu>
        <DropdownMenuTrigger 
          id="share-dropdown-trigger"
          className="share-button flex items-center text-sm font-medium text-gray-400 hover:text-blue-500 transition-all duration-200 group"
          onClick={() => {
            // Try direct share API if available
            if (navigator.share) {
              handleDirectShare();
            }
          }}
        >
          <MoreVertical className={`h-6 w-6 text-purple-400 group-hover:text-purple-300 transition-transform duration-200 group-hover:scale-110 group-active:scale-90 ${iconClassName}`} />
          {!iconOnly && (
            <span className="text-base font-medium text-gray-400 group-hover:text-purple-300 ml-1">
              Share
            </span>
          )}
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="center" className="w-44 bg-[#1D1E2A] border-[#2C2D41] text-white">
          <DropdownMenuItem 
            className="flex items-center space-x-2 focus:bg-[#2C2D41] focus:text-white cursor-pointer"
            onClick={handleCopyLink}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            className="flex items-center space-x-2 focus:bg-[#2C2D41] focus:text-white cursor-pointer"
            onClick={() => {
              handleShareViaMessage();
              trackShareAchievement();
            }}
          >
            <MessageCircle className="h-4 w-4 text-purple-400" />
            <span>Send as Message</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            className="flex items-center space-x-2 focus:bg-[#2C2D41] focus:text-white cursor-pointer"
            onClick={() => {
              handleTwitterShare();
              trackShareAchievement();
            }}
          >
            <Twitter className="h-4 w-4 text-blue-400" />
            <span>Twitter</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            className="flex items-center space-x-2 focus:bg-[#2C2D41] focus:text-white cursor-pointer"
            onClick={() => {
              handleFacebookShare();
              trackShareAchievement();
            }}
          >
            <Facebook className="h-4 w-4 text-blue-600" />
            <span>Facebook</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            className="flex items-center space-x-2 focus:bg-[#2C2D41] focus:text-white cursor-pointer"
            onClick={() => {
              const url = `sms:?body=${encodeURIComponent(`Check out this Clipt: ${getShareUrl()}`)}`;
              window.location.href = url;
              trackShareAchievement();
            }}
          >
            <LinkIcon className="h-4 w-4 text-green-400" />
            <span>Text Message</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ShareButton;
