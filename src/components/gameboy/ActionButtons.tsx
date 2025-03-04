import React, { useEffect, useState } from 'react';
import { Heart, MessageSquare, UserPlus, Trophy } from 'lucide-react';
import { NavigateFunction, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface ActionButtonsProps {
  navigate: NavigateFunction;
  currentPostId?: string;
}

export default function ActionButtons({ navigate, currentPostId }: ActionButtonsProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [activePostId, setActivePostId] = useState<string | null>(null);
  
  // Find the current visible post ID from the screen
  useEffect(() => {
    const findVisiblePost = () => {
      const posts = document.querySelectorAll('[data-post-id]');
      if (!posts.length) return;
      
      // Find the post most in view
      let mostVisiblePost: Element | null = null;
      let maxVisibility = 0;
      
      posts.forEach(post => {
        const rect = post.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Calculate how much of the post is visible (0 to 1)
        const visibility = Math.min(
          Math.max(0, (rect.bottom - 100) / windowHeight),
          Math.max(0, (windowHeight - rect.top) / windowHeight)
        );
        
        if (visibility > maxVisibility) {
          maxVisibility = visibility;
          mostVisiblePost = post;
        }
      });
      
      if (mostVisiblePost) {
        const postId = mostVisiblePost.getAttribute('data-post-id');
        if (postId) {
          setActivePostId(postId);
          console.log('Detected active post:', postId);
        }
      }
    };

    // Run on mount and during scroll
    findVisiblePost();
    window.addEventListener('scroll', findVisiblePost);
    
    return () => {
      window.removeEventListener('scroll', findVisiblePost);
    };
  }, [location.pathname]);
  
  // Handle like button press
  const handleLike = async () => {
    if (!user) {
      toast.error("Please log in to like posts");
      return;
    }
    
    const postId = activePostId || currentPostId;
    if (!postId) {
      toast.error("No post selected");
      return;
    }
    
    try {
      console.log(`Liking post ID: ${postId}`);
      
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existingLike) {
        // Unlike the post
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
          
        toast.success("Unliked post");
      } else {
        // Like the post
        await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id,
            created_at: new Date().toISOString()
          });
          
        toast.success("Liked post");
      }
      
      // Force refresh to update UI
      setTimeout(() => window.location.reload(), 1000);
      
    } catch (error) {
      console.error("Error liking post:", error);
      toast.error("Failed to update like status");
    }
  };
  
  // Handle comment button press
  const handleComment = () => {
    const postId = activePostId || currentPostId;
    if (!postId) {
      toast.error("No post selected");
      return;
    }
    
    console.log(`Opening comments for post ID: ${postId}`);
    
    // Find the post's comment button and click it
    const post = document.querySelector(`[data-post-id="${postId}"]`);
    if (post) {
      const commentBtn = post.querySelector('.comment-button') as HTMLElement;
      if (commentBtn) {
        commentBtn.click();
        return;
      }
    }
    
    // Fallback - navigate to post detail page
    navigate(`/post/${postId}`);
  };
  
  // Handle follow button press
  const handleFollow = async () => {
    if (!user) {
      toast.error("Please log in to follow users");
      return;
    }
    
    const postId = activePostId || currentPostId;
    if (!postId) {
      toast.error("No post selected");
      return;
    }
    
    try {
      // Get post to find user ID
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();
      
      if (!post) {
        toast.error("Post not found");
        return;
      }
      
      if (post.user_id === user.id) {
        toast.error("You cannot follow yourself");
        return;
      }
      
      // Check if already following
      const { data: existingFollow } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', post.user_id)
        .maybeSingle();
      
      if (existingFollow) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', post.user_id);
          
        toast.success("Unfollowed user");
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: post.user_id,
            created_at: new Date().toISOString()
          });
          
        toast.success("Following user");
      }
      
    } catch (error) {
      console.error("Error following user:", error);
      toast.error("Failed to update follow status");
    }
  };
  
  // Handle trophy button press
  const handleTrophy = async () => {
    if (!user) {
      toast.error("Please log in to award trophies");
      return;
    }
    
    const postId = activePostId || currentPostId;
    if (!postId) {
      toast.error("No post selected");
      return;
    }
    
    try {
      // Check if already voted
      const { data: existingVote } = await supabase
        .from('clip_votes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existingVote) {
        // Remove vote
        await supabase
          .from('clip_votes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
          
        toast.success("Trophy removed");
      } else {
        // Add vote
        await supabase
          .from('clip_votes')
          .insert({
            post_id: postId,
            user_id: user.id,
            created_at: new Date().toISOString()
          });
          
        toast.success("Trophy awarded!");
      }
      
      // Force refresh to update UI
      setTimeout(() => window.location.reload(), 1000);
      
    } catch (error) {
      console.error("Error awarding trophy:", error);
      toast.error("Failed to award trophy");
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Diamond pattern buttons */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
        <button 
          onClick={handleLike}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-[#272A37] border border-[#3f4255] hover:bg-[#2d3044] transition-colors"
          aria-label="Like post"
        >
          <Heart className="h-6 w-6 text-red-500" />
        </button>
      </div>
      
      <div className="absolute -left-1/4 top-1/2 transform -translate-y-1/2">
        <button 
          onClick={handleComment}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-[#272A37] border border-[#3f4255] hover:bg-[#2d3044] transition-colors"
          aria-label="Comment on post"
        >
          <MessageSquare className="h-6 w-6 text-blue-500" />
        </button>
      </div>
      
      <div className="absolute left-1/2 transform -translate-x-1/2 top-1/4">
        <button 
          onClick={handleFollow}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-[#272A37] border border-[#3f4255] hover:bg-[#2d3044] transition-colors"
          aria-label="Follow user"
        >
          <UserPlus className="h-6 w-6 text-green-500" />
        </button>
      </div>
      
      <div className="absolute -right-1/4 top-1/2 transform -translate-y-1/2">
        <button 
          onClick={handleTrophy}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-[#272A37] border border-[#3f4255] hover:bg-[#2d3044] transition-colors"
          aria-label="Award trophy"
        >
          <Trophy className="h-6 w-6 text-yellow-500" />
        </button>
      </div>
      
      {/* POST button at bottom */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
        <button 
          onClick={() => navigate('/post/new')}
          className="px-4 py-2 rounded-md bg-[#272A37] text-[#6366F1] font-semibold text-sm border border-[#3f4255] hover:bg-[#2d3044] transition-colors"
          aria-label="Create new post"
        >
          POST
        </button>
      </div>
    </div>
  );
}
