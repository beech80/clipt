import React, { useState } from 'react';
import { NavigateFunction } from 'react-router-dom';
import { Heart, MessageCircle, Trophy, SendHorizontal } from 'lucide-react';
import { useComments } from '@/contexts/CommentContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ActionButtonsProps {
  navigate: NavigateFunction;
  currentPostId?: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ navigate, currentPostId }) => {
  const { openCommentInput } = useComments();
  const [loading, setLoading] = useState<string | null>(null);

  // Handle like action
  const handleLike = async () => {
    if (!currentPostId || loading) return;
    
    try {
      setLoading('like');
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.user) {
        navigate('/auth');
        return;
      }
      
      const userId = session.session.user.id;
      
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', currentPostId)
        .eq('user_id', userId)
        .single();
      
      if (existingLike) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', currentPostId)
          .eq('user_id', userId);
          
        toast.success('Post unliked');
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({
            post_id: currentPostId,
            user_id: userId
          });
          
        toast.success('Post liked');
      }
      
      // Update post like count
      await supabase.rpc('update_post_like_count', { post_id_param: currentPostId });
      
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    } finally {
      setLoading(null);
    }
  };

  // Handle comment action
  const handleComment = () => {
    if (!currentPostId) return;
    
    openCommentInput(currentPostId);
    toast.info('Comment mode activated');
  };

  // Handle trophy action
  const handleTrophy = () => {
    if (!currentPostId) return;
    
    // For now, navigate to the post detail
    navigate(`/post/${currentPostId}`);
    toast.info('Viewing post details');
  };

  // Handle post action
  const handlePost = () => {
    navigate('/post/new');
  };

  return (
    <div className="w-full h-full relative">
      {/* Diamond buttons layout */}
      <div className="absolute w-full h-full">
        {/* Top button - Comment */}
        <button 
          className="absolute top-0 left-1/2 transform -translate-x-1/2 w-14 h-14 rounded-full bg-[#171822] border border-[#2c2d4a] flex items-center justify-center hover:bg-[#1e1f2b] transition-colors"
          onClick={handleComment}
          disabled={!currentPostId}
          aria-label="Comment"
        >
          <MessageCircle size={22} className="text-[#6366F1]" />
        </button>
        
        {/* Right button - Trophy */}
        <button 
          className="absolute top-1/2 right-0 transform -translate-y-1/2 w-14 h-14 rounded-full bg-[#171822] border border-[#2c2d4a] flex items-center justify-center hover:bg-[#1e1f2b] transition-colors"
          onClick={handleTrophy}
          disabled={!currentPostId}
          aria-label="Trophy"
        >
          <Trophy size={22} className="text-[#6366F1]" />
        </button>
        
        {/* Bottom button - POST */}
        <button 
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-14 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg"
          onClick={handlePost}
          aria-label="Create Post"
        >
          <span className="text-sm font-bold mr-1">POST</span>
          <SendHorizontal size={16} className="text-white" />
        </button>
        
        {/* Left button - Like */}
        <button 
          className="absolute top-1/2 left-0 transform -translate-y-1/2 w-14 h-14 rounded-full bg-[#171822] border border-[#2c2d4a] flex items-center justify-center hover:bg-[#1e1f2b] transition-colors"
          onClick={handleLike}
          disabled={loading === 'like' || !currentPostId}
          aria-label="Like"
        >
          <Heart 
            size={22} 
            className={loading === 'like' ? 'text-gray-400 animate-pulse' : 'text-[#6366F1]'} 
            fill={loading === 'like' ? 'none' : 'currentColor'} 
          />
        </button>
      </div>
    </div>
  );
};

export default ActionButtons;
