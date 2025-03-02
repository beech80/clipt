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

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Diamond shaped action buttons - with solid colored backgrounds */}
      <div className="relative w-full h-full">
        {/* Top button - Like (Heart) */}
        <button
          onClick={() => {
            handleLike();
            if (onAction) onAction('like');
          }}
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 w-10 h-10 sm:w-12 sm:h-12
            bg-[#FF3866] rounded-full flex items-center justify-center
            shadow-md hover:bg-opacity-90 active:scale-95 transition-all"
          aria-label="Like"
        >
          <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="white" />
        </button>
        
        {/* Left button - Comment (MessageSquare) */}
        <button
          onClick={() => {
            handleComment();
            if (onAction) onAction('comment');
          }}
          className="absolute top-1/2 left-0 -translate-x-1/4 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12
            bg-[#3D93FC] rounded-full flex items-center justify-center
            shadow-md hover:bg-opacity-90 active:scale-95 transition-all"
          aria-label="Comment"
        >
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="white" />
        </button>
        
        {/* Right button - Follow (User) */}
        <button
          onClick={() => {
            handleFollow();
            if (onAction) onAction('follow');
          }}
          className="absolute top-1/2 right-0 translate-x-1/4 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12
            bg-[#26C870] rounded-full flex items-center justify-center
            shadow-md hover:bg-opacity-90 active:scale-95 transition-all"
          aria-label="Follow"
        >
          <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="white" />
        </button>
        
        {/* Bottom button - Rank (Trophy) */}
        <button
          onClick={() => {
            handleRank();
            if (onAction) onAction('rank');
          }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/4 w-10 h-10 sm:w-12 sm:h-12
            bg-[#FFE55C] rounded-full flex items-center justify-center
            shadow-md hover:bg-opacity-90 active:scale-95 transition-all"
          aria-label="Rank"
        >
          <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="white" />
        </button>
        
        {/* POST button */}
        <button
          onClick={() => navigate('/post/new')}
          className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 w-14 h-14 sm:w-16 sm:h-16
            bg-[#9c27b0] text-white rounded-full text-xs font-medium flex items-center justify-center
            shadow-md hover:bg-opacity-90 active:scale-95 transition-all"
          aria-label="Post"
        >
          <span className="font-bold">POST</span>
        </button>
      </div>
    </div>
  );
};

export default ActionButtons;
