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

  // Modern button style with glass morphism and gradients
  const modernButtonStyle = `
    w-[32px] h-[32px] 
    flex items-center justify-center 
    active:scale-95 transition-all duration-300
    bg-gradient-to-br from-gray-900 to-black
    rounded-full
    backdrop-blur
    border border-gray-800
    shadow-lg
    hover:shadow-xl hover:scale-105
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50
  `;

  // Icon style with modern look
  const iconStyle = "filter drop-shadow(0 2px 3px rgba(0,0,0,0.3))";

  return (
    <div className="relative w-[70px] h-[70px] flex items-center justify-center">
      {/* Heart button (Y position - top) */}
      <button
        onClick={() => {
          handleLike();
          if (onAction) onAction('like');
        }}
        className={`${modernButtonStyle} absolute -top-5 left-1/2 -translate-x-1/2 focus:ring-red-500`}
        aria-label="Like"
        style={{background: "linear-gradient(145deg, #111, #000)"}}
      >
        <Heart className={`w-5 h-5 text-[#FF385F] ${iconStyle}`} fill="#FF385F" stroke="none" />
      </button>
      
      {/* Message button (X position - left) */}
      <button
        onClick={() => {
          handleComment();
          if (onAction) onAction('comment');
        }}
        className={`${modernButtonStyle} absolute top-1/2 -left-5 -translate-y-1/2 focus:ring-blue-500`}
        aria-label="Comment"
        style={{background: "linear-gradient(145deg, #111, #000)"}}
      >
        <MessageSquare className={`w-5 h-5 text-[#2F5EC4] ${iconStyle}`} fill="#2F5EC4" stroke="none" />
      </button>
      
      {/* Follow button (B position - right) */}
      <button
        onClick={() => {
          handleFollow();
          if (onAction) onAction('follow');
        }}
        className={`${modernButtonStyle} absolute top-1/2 -right-5 -translate-y-1/2 focus:ring-green-500`}
        aria-label="Follow"
        style={{background: "linear-gradient(145deg, #111, #000)"}}
      >
        <User className={`w-5 h-5 text-[#27AE60] ${iconStyle}`} fill="#27AE60" stroke="none" />
      </button>
      
      {/* Trophy button (A position - bottom) */}
      <button
        onClick={() => {
          handleRank();
          if (onAction) onAction('rank');
        }}
        className={`${modernButtonStyle} absolute -bottom-5 left-1/2 -translate-x-1/2 focus:ring-yellow-500`}
        aria-label="Rank"
        style={{background: "linear-gradient(145deg, #111, #000)"}}
      >
        <Trophy className={`w-5 h-5 text-[#F1C40F] ${iconStyle}`} fill="#F1C40F" stroke="none" />
      </button>
      
      {/* POST button - positioned below the button diamond */}
      <button
        onClick={() => navigate('/post/new')}
        className="absolute -bottom-14 left-1/2 -translate-x-1/2 w-[32px] h-[32px] bg-gradient-to-r from-purple-600 to-purple-800 rounded-full flex items-center justify-center active:scale-95 transition-all duration-300 hover:shadow-lg hover:scale-105 shadow-md"
        aria-label="Post"
        style={{background: "linear-gradient(145deg, #9C27B0, #7B1FA2)"}}
      >
        <Camera className="w-5 h-5 text-white filter drop-shadow(0 1px 2px rgba(0,0,0,0.3))" />
        <span className="absolute text-[8px] font-bold text-white -bottom-5 drop-shadow-sm">POST</span>
      </button>
    </div>
  );
};

export default ActionButtons;
