import React from 'react';
import { Heart, MessageSquare, User, Trophy, Camera } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ActionButtonsProps {
  postId: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ postId }) => {
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
    <div className="relative w-[70px] h-[70px] flex items-center justify-center">
      {/* Diamond shaped action buttons */}
      <div className="relative w-full h-full">
        {/* Top button - Like (Heart) */}
        <button
          onClick={handleLike}
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 w-8 h-8 
            bg-[#ff3a5e] bg-opacity-20 rounded-full flex items-center justify-center
            shadow-sm hover:bg-opacity-30 active:scale-95 transition-all"
          aria-label="Like"
        >
          <Heart className="w-4 h-4 text-[#ff3a5e]" />
        </button>
        
        {/* Left button - Comment */}
        <button
          onClick={handleComment}
          className="absolute top-1/2 left-0 -translate-x-1/4 -translate-y-1/2 w-8 h-8 
            bg-[#4f9cf9] bg-opacity-20 rounded-full flex items-center justify-center
            shadow-sm hover:bg-opacity-30 active:scale-95 transition-all"
          aria-label="Comment"
        >
          <MessageSquare className="w-4 h-4 text-[#4f9cf9]" />
        </button>
        
        {/* Right button - Follow */}
        <button
          onClick={handleFollow}
          className="absolute top-1/2 right-0 translate-x-1/4 -translate-y-1/2 w-8 h-8 
            bg-[#2ecc71] bg-opacity-20 rounded-full flex items-center justify-center
            shadow-sm hover:bg-opacity-30 active:scale-95 transition-all"
          aria-label="Follow"
        >
          <User className="w-4 h-4 text-[#2ecc71]" />
        </button>
        
        {/* Bottom button - Rank */}
        <button
          onClick={handleRank}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/4 w-8 h-8 
            bg-[#f1c40f] bg-opacity-20 rounded-full flex items-center justify-center
            shadow-sm hover:bg-opacity-30 active:scale-95 transition-all"
          aria-label="Rank"
        >
          <Trophy className="w-4 h-4 text-[#f1c40f]" />
        </button>
        
        {/* Center POST button */}
        <button
          onClick={() => navigate('/clipts/post')}
          className="absolute bottom-[calc(100%+15px)] left-1/2 -translate-x-1/2 px-3 py-1.5 
            bg-[#8047f8] text-white rounded-full text-xs font-medium flex items-center gap-1
            shadow-sm hover:bg-opacity-90 active:scale-95 transition-all"
          aria-label="Post"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>POST</span>
        </button>
      </div>
    </div>
  );
};

export default ActionButtons;
