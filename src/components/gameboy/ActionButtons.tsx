import React from 'react';
import { Heart, MessageSquare, User, Trophy, Camera } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ActionButtonsProps {
  postId: string;
  onAction?: (action: string) => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ postId, onAction }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      // Check if user already liked this post
      const { data: existingLike } = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
        
        toast.success('Unliked post');
      } else {
        // Like
        await supabase
          .from('likes')
          .insert([{ user_id: user.id, post_id: postId }]);
        
        toast.success('Liked post!');
      }
    } catch (error) {
      toast.error('Failed to like post. Please try again.');
    }
  };

  const handleComment = () => {
    // Implementation of comment functionality
    toast('Opening comments');
  };

  const handleFollow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      // Get post creator id
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();
      
      if (!post) {
        toast.error('Post not found');
        return;
      }

      // Check if user already follows this creator
      const { data: existingFollow } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', post.user_id)
        .single();

      if (existingFollow) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', post.user_id);
        
        toast.success('Unfollowed user');
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert([{ follower_id: user.id, following_id: post.user_id }]);
        
        toast.success('Now following user!');
      }
    } catch (error) {
      toast.error('Failed to follow. Please try again.');
    }
  };

  const handleRank = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      // Check if user already ranked this post
      const { data: existingVote } = await supabase
        .from('clip_votes')
        .select('*')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single();

      if (existingVote) {
        // Remove rank
        await supabase
          .from('clip_votes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
        
        toast.success('Rank removed');
      } else {
        // Rank
        await supabase
          .from('clip_votes')
          .insert([{ user_id: user.id, post_id: postId }]);
        
        toast.success('Clip ranked!');
      }
    } catch (error) {
      toast.error('Failed to rank clip. Please try again.');
    }
  };

  const buttonStyle = "w-[36px] h-[36px] rounded-full flex items-center justify-center active:scale-95 transition-all";

  return (
    <div className="relative w-[120px] h-[120px] flex items-center justify-center">
      {/* Diamond shaped formation with more spacing like xbox controller */}
      
      {/* Heart button (top) */}
      <button
        onClick={() => {
          handleLike();
          if (onAction) onAction('like');
        }}
        className={`${buttonStyle} bg-[#FF385F] absolute -top-12 left-1/2 -translate-x-1/2`}
        aria-label="Like"
      >
        <Heart className="w-5 h-5 text-white" fill="white" stroke="none" />
      </button>
      
      {/* Message button (left) */}
      <button
        onClick={() => {
          handleComment();
          if (onAction) onAction('comment');
        }}
        className={`${buttonStyle} bg-[#2F5EC4] absolute top-1/2 -left-12 -translate-y-1/2`}
        aria-label="Comment"
      >
        <MessageSquare className="w-5 h-5 text-white" fill="white" stroke="none" />
      </button>
      
      {/* Follow button (right) */}
      <button
        onClick={() => {
          handleFollow();
          if (onAction) onAction('follow');
        }}
        className={`${buttonStyle} bg-[#27AE60] absolute top-1/2 -right-12 -translate-y-1/2`}
        aria-label="Follow"
      >
        <User className="w-5 h-5 text-white" fill="white" stroke="none" />
      </button>
      
      {/* Trophy button (bottom) */}
      <button
        onClick={() => {
          handleRank();
          if (onAction) onAction('rank');
        }}
        className={`${buttonStyle} bg-[#F1C40F] absolute -bottom-12 left-1/2 -translate-x-1/2`}
        aria-label="Rank"
      >
        <Trophy className="w-5 h-5 text-white" fill="white" stroke="none" />
      </button>
      
      {/* POST button */}
      <button
        onClick={() => navigate('/post/new')}
        className={`absolute -bottom-24 left-1/2 -translate-x-1/2 ${buttonStyle} bg-[#9C27B0]`}
        aria-label="Post"
      >
        <Camera className="w-5 h-5 text-white" />
        <span className="absolute text-[10px] font-bold text-white -bottom-5">POST</span>
      </button>
    </div>
  );
};

export default ActionButtons;
