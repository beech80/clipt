import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, UserPlus, Trophy, Camera, ArrowLeft, Share2, Bookmark, Zap, Flag } from 'lucide-react';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CommentList } from '../post/CommentList';
import { useNavigate } from 'react-router-dom';

interface ActionButtonsProps {
  onAction: (action: string) => void;
  postId: string;
}

const ActionButtons = ({ onAction, postId }: ActionButtonsProps) => {
  const { user } = useAuth();
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const navigate = useNavigate();
  
  // Log postId for debugging
  useEffect(() => {
    console.log(`ActionButtons component mounted with postId: ${postId}`);
    console.log('postId type:', typeof postId);
  }, [postId]);

  // Exit early if no postId
  if (!postId) {
    console.error("No postId provided to ActionButtons");
    return null;
  }

  const handleLike = async () => {
    if (!user) {
      toast.error("Please login to like posts");
      return;
    }

    try {
      if (!isLiked) {
        await supabase
          .from('likes')
          .insert([{ post_id: postId, user_id: user.id }]);
        setIsLiked(true);
        toast.success("Post liked!");
      } else {
        await supabase
          .from('likes')
          .delete()
          .match({ post_id: postId, user_id: user.id });
        setIsLiked(false);
        toast.success("Post unliked!");
      }
      onAction('like');
    } catch (error) {
      toast.error("Error updating like status");
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast.error("Please login to follow users");
      return;
    }

    try {
      if (!isFollowing) {
        await supabase
          .from('follows')
          .insert([{ follower_id: user.id, following_id: postId }]);
        setIsFollowing(true);
        toast.success("Following user!");
      } else {
        await supabase
          .from('follows')
          .delete()
          .match({ follower_id: user.id, following_id: postId });
        setIsFollowing(false);
        toast.success("Unfollowed user!");
      }
      onAction('follow');
    } catch (error) {
      toast.error("Error updating follow status");
    }
  };

  const handleRank = async () => {
    if (!user) {
      toast.error("Please login to rank posts");
      return;
    }

    try {
      await supabase
        .from('clip_votes')
        .insert([{ post_id: postId, user_id: user.id }]);
      toast.success("Clip ranked!");
      onAction('rank');
    } catch (error) {
      toast.error("You've already ranked this clip!");
    }
  };

  const handleBookmark = () => {
    if (!user) {
      toast.error("Please login to bookmark posts");
      return;
    }
    
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? "Removed from bookmarks" : "Added to bookmarks");
    onAction('bookmark');
  };

  const handleShare = () => {
    const clipUrl = `${window.location.origin}/post/${postId}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Check out this clip on Clipt',
        text: 'I found this awesome clip on Clipt!',
        url: clipUrl,
      })
      .then(() => {
        toast.success('Shared successfully');
      })
      .catch((error) => {
        console.error('Error sharing:', error);
        copyToClipboard(clipUrl);
      });
    } else {
      copyToClipboard(clipUrl);
    }
    
    onAction('share');
  };
  
  const handleReport = () => {
    toast.info("Report submitted. Thank you for keeping Clipt safe.");
    onAction('report');
  };
  
  const handleBoost = () => {
    if (!user) {
      toast.error("Please login to boost clips");
      return;
    }
    
    toast.success("Clip boosted! It will be shown to more users.");
    onAction('boost');
  };
  
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Link copied to clipboard");
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="relative">
      {/* Center diamond layout buttons */}
      <div className="flex flex-col items-center relative">
        {/* Heart button - Top */}
        <button 
          className="action-button w-12 h-12 rounded-full flex items-center justify-center
          bg-[#1A1F2C] border border-red-600/30 mb-8 
          shadow-[0_0_15px_rgba(255,0,0,0.3)]
          hover:shadow-[0_0_20px_rgba(255,0,0,0.4)] transition-all hover:scale-110"
          onClick={handleLike}
        >
          <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-red-500'}`} />
        </button>
        
        <div className="flex w-full justify-between mb-8">
          {/* Comment button - Left */}
          <button 
            className="action-button w-12 h-12 rounded-full flex items-center justify-center
            bg-[#1A1F2C] border border-blue-600/30
            shadow-[0_0_15px_rgba(0,120,255,0.3)]
            hover:shadow-[0_0_20px_rgba(0,120,255,0.4)] transition-all hover:scale-110"
            onClick={() => setIsCommentOpen(true)}
          >
            <MessageSquare className="w-6 h-6 text-blue-500" />
          </button>
          
          {/* Follow button - Right */}
          <button 
            className="action-button w-12 h-12 rounded-full flex items-center justify-center
            bg-[#1A1F2C] border border-green-600/30
            shadow-[0_0_15px_rgba(0,255,0,0.3)]
            hover:shadow-[0_0_20px_rgba(0,255,0,0.4)] transition-all hover:scale-110"
            onClick={handleFollow}
          >
            <UserPlus className={`w-6 h-6 ${isFollowing ? 'text-green-500' : 'text-green-500'}`} />
          </button>
        </div>
        
        {/* Trophy button - Bottom */}
        <button 
          className="action-button w-12 h-12 rounded-full flex items-center justify-center
          bg-[#1A1F2C] border border-yellow-600/30 mb-8
          shadow-[0_0_15px_rgba(255,255,0,0.3)]
          hover:shadow-[0_0_20px_rgba(255,255,0,0.4)] transition-all hover:scale-110"
          onClick={handleRank}
        >
          <Trophy className="w-6 h-6 text-yellow-500" />
        </button>
        
        {/* Camera/Post button - Very Bottom */}
        <button 
          className="action-button w-12 h-12 rounded-full flex flex-col items-center justify-center
          bg-[#1A1F2C] border border-purple-600/30 mt-4
          shadow-[0_0_15px_rgba(147,51,234,0.3)]
          hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all hover:scale-110"
          onClick={() => {
            navigate('/post/new');
            toast.success('Opening post creation...');
          }}
        >
          <Camera className="w-5 h-5 text-purple-500 mb-1" />
          <span className="text-[10px] text-purple-500 font-bold">POST</span>
        </button>
      </div>
      
      {/* Right side action buttons */}
      <div className="absolute right-0 top-0 h-full flex flex-col justify-between py-4">
        {/* Share Button */}
        <button 
          className="action-button w-8 h-8 rounded-full flex items-center justify-center
          bg-[#1A1F2C] border border-purple-400/30 mb-3
          shadow-[0_0_10px_rgba(147,51,234,0.3)]
          hover:shadow-[0_0_15px_rgba(147,51,234,0.4)] transition-all hover:scale-110"
          onClick={handleShare}
        >
          <Share2 className="w-4 h-4 text-purple-500" />
        </button>
        
        {/* Bookmark Button */}
        <button 
          className="action-button w-8 h-8 rounded-full flex items-center justify-center
          bg-[#1A1F2C] border border-orange-400/30 mb-3
          shadow-[0_0_10px_rgba(249,115,22,0.3)]
          hover:shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all hover:scale-110"
          onClick={handleBookmark}
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-orange-500' : ''} text-orange-500`} />
        </button>
        
        {/* Boost Button */}
        <button 
          className="action-button w-8 h-8 rounded-full flex items-center justify-center
          bg-[#1A1F2C] border border-sky-400/30 mb-3
          shadow-[0_0_10px_rgba(56,189,248,0.3)]
          hover:shadow-[0_0_15px_rgba(56,189,248,0.4)] transition-all hover:scale-110"
          onClick={handleBoost}
        >
          <Zap className="w-4 h-4 text-sky-500" />
        </button>
        
        {/* Report Button */}
        <button 
          className="action-button w-8 h-8 rounded-full flex items-center justify-center
          bg-[#1A1F2C] border border-red-400/30
          shadow-[0_0_10px_rgba(239,68,68,0.3)]
          hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all hover:scale-110"
          onClick={handleReport}
        >
          <Flag className="w-4 h-4 text-red-500" />
        </button>
      </div>
      
      {/* Comment dialog */}
      {postId && (
        <Dialog open={isCommentOpen} onOpenChange={setIsCommentOpen}>
          <DialogContent className="sm:max-w-[600px] bg-gaming-800/95 backdrop-blur-sm p-0 border-gaming-400/30">
            <div className="flex items-center gap-2 p-4 border-b border-gaming-400/20">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCommentOpen(false)}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold text-white">Comments</h2>
            </div>
            
            <div className="max-h-[80vh] overflow-y-auto">
              <CommentList 
                postId={postId} 
                onBack={() => setIsCommentOpen(false)}
                onCommentAdded={() => {
                  console.log("Comment added, refreshing");
                  // You can add any additional refresh logic here
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ActionButtons;
