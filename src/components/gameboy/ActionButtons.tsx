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
    if (postId) {
      // Navigate to comments section of the post
      navigate(`/post/${postId}#comments`);
      toast.success('Opening comments');
    } else {
      toast.error('Cannot open comments for this post');
    }
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

  // Xbox style button class with glossy effect - larger size
  const xboxButtonStyle = `
    w-[32px] h-[32px] 
    flex items-center justify-center 
    active:scale-95 transition-all
    bg-black border border-gray-800
    rounded-full
    shadow-[inset_0_1px_3px_rgba(255,255,255,0.4),0_3px_5px_rgba(0,0,0,0.5)]
  `;

  return (
    <div className="relative w-[70px] h-[70px] flex items-center justify-center">
      {/* Heart button (Y position - top) */}
      <button
        onClick={() => {
          handleLike();
          if (onAction) onAction('like');
        }}
        className={`${xboxButtonStyle} absolute -top-5 left-1/2 -translate-x-1/2`}
        aria-label="Like"
      >
        <Heart className="w-5 h-5 text-[#FF385F]" fill="#FF385F" stroke="none" />
      </button>
      
      {/* Message button (X position - left) */}
      <button
        onClick={() => {
          handleComment();
          if (onAction) onAction('comment');
        }}
        className={`${xboxButtonStyle} absolute top-1/2 -left-5 -translate-y-1/2`}
        aria-label="Comment"
      >
        <MessageSquare className="w-5 h-5 text-[#2F5EC4]" fill="#2F5EC4" stroke="none" />
      </button>
      
      {/* Follow button (B position - right) */}
      <button
        onClick={() => {
          handleFollow();
          if (onAction) onAction('follow');
        }}
        className={`${xboxButtonStyle} absolute top-1/2 -right-5 -translate-y-1/2`}
        aria-label="Follow"
      >
        <User className="w-5 h-5 text-[#27AE60]" fill="#27AE60" stroke="none" />
      </button>
      
      {/* Trophy button (A position - bottom) */}
      <button
        onClick={() => {
          handleRank();
          if (onAction) onAction('rank');
        }}
        className={`${xboxButtonStyle} absolute -bottom-5 left-1/2 -translate-x-1/2`}
        aria-label="Rank"
      >
        <Trophy className="w-5 h-5 text-[#F1C40F]" fill="#F1C40F" stroke="none" />
      </button>
      
      {/* POST button - positioned below the button diamond */}
      <button
        onClick={() => navigate('/post/new')}
        className="absolute -bottom-14 left-1/2 -translate-x-1/2 w-[32px] h-[32px] bg-[#9C27B0] rounded-full flex items-center justify-center active:scale-95 transition-all"
        aria-label="Post"
      >
        <Camera className="w-5 h-5 text-white" />
        <span className="absolute text-[8px] font-bold text-white -bottom-5">POST</span>
      </button>
    </div>
  );
};

export default ActionButtons;
