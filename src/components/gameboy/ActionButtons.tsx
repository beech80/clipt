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

  const handlePost = () => {
    navigate('/post/create');
    toast.success("Creating a new post");
    onAction('post');
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
      {/* Diamond formation buttons */}
      <div className="grid grid-cols-3 gap-2">
        <div className="col-start-2">
          <button 
            className="action-button w-12 h-12 rounded-full flex items-center justify-center
            bg-red-600 border border-red-600/30
            shadow-[0_0_15px_rgba(255,0,0,0.3)]
            hover:shadow-[0_0_20px_rgba(255,0,0,0.4)] transition-all hover:scale-110"
            onClick={handleLike}
          >
            <Heart className={`w-6 h-6 text-white ${isLiked ? 'fill-white' : ''}`} />
          </button>
        </div>
        
        <div className="col-start-1 row-start-2">
          <button 
            className="action-button w-12 h-12 rounded-full flex items-center justify-center
            bg-blue-600 border border-blue-600/30
            shadow-[0_0_15px_rgba(0,120,255,0.3)]
            hover:shadow-[0_0_20px_rgba(0,120,255,0.4)] transition-all hover:scale-110"
            onClick={() => setIsCommentOpen(true)}
          >
            <MessageSquare className="w-6 h-6 text-white" />
          </button>
        </div>
        
        <div className="col-start-3 row-start-2">
          <button 
            className="action-button w-12 h-12 rounded-full flex items-center justify-center
            bg-green-600 border border-green-600/30
            shadow-[0_0_15px_rgba(0,255,0,0.3)]
            hover:shadow-[0_0_20px_rgba(0,255,0,0.4)] transition-all hover:scale-110"
            onClick={handleFollow}
          >
            <UserPlus className={`w-6 h-6 text-white ${isFollowing ? 'fill-white' : ''}`} />
          </button>
        </div>
        
        <div className="col-start-2 row-start-3">
          <button 
            className="action-button w-12 h-12 rounded-full flex items-center justify-center
            bg-yellow-600 border border-yellow-600/30
            shadow-[0_0_15px_rgba(255,215,0,0.3)]
            hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] transition-all hover:scale-110"
            onClick={handleRank}
          >
            <Trophy className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
      
      {/* Post button below diamond */}
      <div className="flex justify-center mt-4">
        <button 
          className="action-button w-14 h-14 rounded-full flex items-center justify-center
          bg-purple-600 border border-purple-600/30
          shadow-[0_0_15px_rgba(128,0,128,0.3)]
          hover:shadow-[0_0_20px_rgba(128,0,128,0.4)] transition-all hover:scale-110"
          onClick={handlePost}
        >
          <div className="text-white text-xs font-bold">POST</div>
        </button>
      </div>

      {/* Comment dialog */}
      <Dialog open={isCommentOpen} onOpenChange={setIsCommentOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Comments</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsCommentOpen(false)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
          <CommentList postId={postId} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActionButtons;
