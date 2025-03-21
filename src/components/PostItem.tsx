import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import PostContent from "./post/PostContent";
import { supabase } from "@/lib/supabase";
import { Post } from "@/types/post";
import { Heart, MessageSquare, Trophy, Trash2, MoreVertical, UserCheck, UserPlus, Save, Bookmark } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommentList } from "./post/CommentList"; 
import InlineComments from "./post/InlineComments";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import ShareButton from "./ShareButton";

interface PostItemProps {
  post: Post;
  onCommentClick?: () => void;
  highlight?: boolean;
  'data-post-id'?: string;
  isCliptsPage?: boolean;
}

const PostItem: React.FC<PostItemProps> = ({ 
  post, 
  onCommentClick, 
  highlight = false, 
  'data-post-id': postIdAttr,
  isCliptsPage = false
}) => {
  // Use location to detect if we're on the Clipts page
  const location = useLocation();
  const onCliptsPage = isCliptsPage || location.pathname === '/clipts';

  const [isLoading, setIsLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [trophyCount, setTrophyCount] = useState(0);
  const [hasTrophy, setHasTrophy] = useState(false);
  const [trophyLoading, setTrophyLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const { user } = useAuth();
  const isOwner = user?.id === post.user_id;
  const queryClient = useQueryClient();

  // Ensure we have a valid string post ID
  const postId = post && post.id ? String(post.id) : "";

  // Debug logging
  useEffect(() => {
    console.log(`PostItem rendering with postId: ${postId}`, {
      postObject: post,
      postIdRaw: post?.id,
      postIdNormalized: postId
    });
    setIsLoading(false);
  }, [postId, post]);

  // Fetch and update comments count
  const fetchCommentsCount = async () => {
    try {
      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true})
        .eq('post_id', postId);
        
      if (error) {
        console.error('Error fetching comments count:', error);
        return;
      }
      
      // Removed local state update
    } catch (error) {
      console.error('Error in fetchCommentsCount:', error);
    }
  };

  useEffect(() => {
    fetchCommentsCount();
  }, [postId]);

  // Fetch comment count
  const { data: commentsCountData = 0, isLoading: commentsCountLoading } = useQuery({
    queryKey: ['comments-count', postId],
    queryFn: async () => {
      if (!postId) return 0;
      
      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true})
        .eq('post_id', postId);
      
      if (error) {
        console.error("Error fetching comments count:", error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!postId
  });

  const commentsCount = commentsCountData;

  const handleDeletePost = async () => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      toast.success('Post deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleLike = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    if (!user) {
      toast.error("Please login to like posts");
      return;
    }
    
    if (likeLoading) return;
    
    // Optimistically update UI state
    setLiked(!liked);
    setLikesCount(prev => liked ? Math.max(0, prev - 1) : prev + 1);
    setLikeLoading(true);
    
    try {
      console.log(`Liking post ${postId}`);
      
      // Check if user already liked the post
      const { data: existingLike, error: checkError } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      let count;
      
      if (existingLike) {
        // Remove like
        const { error: removeError } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
          
        if (removeError) throw removeError;
      } else {
        // Add like
        const { error: addError } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id,
            created_at: new Date().toISOString()
          });
          
        if (addError) throw addError;
      }
      
      // Get updated count (only if needed for analytics, not for UI update)
      // This query is optional and could be removed to speed up the response
      const { count: updatedCount, error: countError } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);
        
      if (countError) throw countError;
      count = updatedCount;
      
      // Dispatch event to notify other components
      const likeUpdateEvent = new CustomEvent('like-update', {
        detail: {
          postId,
          count: count || 0,
          active: !existingLike
        }
      });
      window.dispatchEvent(likeUpdateEvent);
      
      // Only invalidate the specific post query, not all queries
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      
    } catch (error) {
      console.error("Error liking post:", error);
      toast.error("Failed to update like status");
      // Revert optimistic update on error
      setLiked(liked);
      setLikesCount(prev => liked ? prev + 1 : Math.max(0, prev - 1));
    } finally {
      setLikeLoading(false);
    }
  };

  const handleComment = () => {
    setIsDialogOpen(true);
  };

  const submitComment = async () => {
    if (!user) {
      toast.error('Please login to comment');
      return;
    }
    
    if (!commentText.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: commentText.trim(),
          created_at: new Date().toISOString()
        })
        .select('*, profiles:user_id(username, avatar_url, display_name)');
      
      if (error) throw error;
      
      // Update local state
      setCommentText('');
      setIsDialogOpen(false);
      toast.success('Comment added');
      
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentClick = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    if (!postId) {
      console.error("Cannot add comment to invalid post ID");
      toast.error("Unable to comment on this post");
      return;
    }
    
    console.log(`Opening comments for post ID: ${postId}`);
    setShowComments(!showComments);
    
    if (onCommentClick) {
      onCommentClick();
    }
  };

  const handleProfileClick = (userId: string) => {
    if (!userId) {
      console.error('Invalid user ID for profile navigation');
      return;
    }
    try {
      console.log(`Navigating to profile: ${userId}`);
      // Use window.location for more reliable navigation
      window.location.href = `/profile/${userId}`;
    } catch (error) {
      console.error('Error navigating to profile:', error);
      toast.error('Could not navigate to profile');
    }
  };

  const handleGameClick = (e: React.MouseEvent, gameId: string, gameName: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Navigate to game-specific page when a game is clicked
    if (gameId) {
      console.log(`Navigating to game: ${gameName} (${gameId})`);
      // Use window.location for more reliable navigation
      window.location.href = `/game/${gameId}`;
    }
  };

  const handleTrophyVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast.error("Login to rank this clip");
      return;
    }
    
    if (trophyLoading) return;
    
    // Optimistically update UI
    const newHasTrophy = !hasTrophy;
    const currentDisplayedRank = post.rank || trophyCount || 0;
    const newRank = newHasTrophy ? currentDisplayedRank + 1 : Math.max(0, currentDisplayedRank - 1);
    
    setHasTrophy(newHasTrophy);
    setTrophyCount(prev => newHasTrophy ? prev + 1 : Math.max(0, prev - 1));
    setTrophyLoading(true);
    
    try {
      console.log(`Ranking post ${postId}`);
      
      // Run queries in parallel for better performance
      const [postResult, voteResult] = await Promise.all([
        // Get current rank
        supabase
          .from('posts')
          .select('rank')
          .eq('id', postId)
          .single(),
          
        // Check if user already voted
        supabase
          .from('clip_votes')
          .select('*')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .maybeSingle()
      ]);
      
      if (postResult.error) throw postResult.error;
      if (voteResult.error) throw voteResult.error;
      
      const currentRank = postResult.data?.rank || 0;
      const existingVote = voteResult.data;
      
      if (existingVote) {
        // User already voted, so removing the vote should decrease rank
        await Promise.all([
          // Remove vote
          supabase
            .from('clip_votes')
            .delete()
            .eq('id', existingVote.id),
            
          // Decrease post rank
          supabase
            .from('posts')
            .update({ rank: Math.max(0, currentRank - 1) })
            .eq('id', postId)
        ]);
        
        toast.success("Ranking removed");
        
      } else {
        // Add vote and increase rank
        await Promise.all([
          // Add vote
          supabase
            .from('clip_votes')
            .insert({
              post_id: postId,
              user_id: user.id,
              created_at: new Date().toISOString()
            }),
            
          // Increase post rank
          supabase
            .from('posts')
            .update({ rank: currentRank + 1 })
            .eq('id', postId)
        ]);
        
        toast.success("Clip ranked up!");
        
        // Optionally follow the post creator (if it's not the user's own post)
        if (post.user_id !== user.id) {
          // Don't await this, let it happen in the background
          handleFollow();
        }
      }
      
      // Only invalidate necessary queries
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      
      // Dispatch trophy update event
      const trophyUpdateEvent = new CustomEvent('trophy-update', {
        detail: {
          postId,
          count: newHasTrophy ? trophyCount + 1 : Math.max(0, trophyCount - 1),
          active: newHasTrophy,
          rank: newHasTrophy ? currentRank + 1 : Math.max(0, currentRank - 1)
        }
      });
      window.dispatchEvent(trophyUpdateEvent);
      
    } catch (error) {
      console.error("Error ranking clip:", error);
      toast.error("Failed to update rank");
      
      // Revert the optimistic updates on error
      setHasTrophy(!newHasTrophy);
      setTrophyCount(prev => !newHasTrophy ? prev + 1 : Math.max(0, prev - 1));
    } finally {
      setTrophyLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast.error('Please sign in to follow');
      return;
    }

    try {
      const { data: existingFollow, error: checkError } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', post.user_id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingFollow) {
        // Unfollow the user
        const { error: removeError } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', post.user_id);

        if (removeError) throw removeError;
        
        setIsFollowing(false);
        toast.success('Unfollowed user');
      } else {
        // Follow the user
        const { error: followError } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: post.user_id,
            created_at: new Date().toISOString()
          });

        if (followError) throw followError;
        
        setIsFollowing(true);
        toast.success('Followed user');
      }
    } catch (error) {
      console.error('Error handling follow:', error);
      toast.error('Failed to update follow status');
    }
  };

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user || !post.user_id) return;
      
      const { data: existingFollow, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', post.user_id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking follow status:', error);
        return;
      }
      
      setIsFollowing(!!existingFollow);
    };
    
    checkFollowStatus();
  }, [user, post.user_id]);

  // Debounce function to prevent excessive rerenders
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout | null = null;
    return (...args: any[]) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Memoize often used functions
  const updateTrophyCount = useCallback(async () => {
    if (!postId) return;
    
    try {
      const { count, error: countError } = await supabase
        .from('clip_votes')
        .select('*', { count: 'exact', head: true})
        .eq('post_id', postId);
      
      if (countError) {
        console.error('Error updating trophy count:', countError);
        return;
      }
      
      setTrophyCount(count || 0);
      
      // Also update trophy status if user is logged in
      if (user) {
        const { data, error } = await supabase
          .from('clip_votes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id);
          
        if (error && error.code !== 'PGRST116') {
          console.error('Error checking trophy status:', error);
          return;
        }
        
        setHasTrophy(!!data);
      }
    } catch (error) {
      console.error('Error in updateTrophyCount:', error);
    }
  }, [postId, user, supabase]);

  // Combined trophy update listener
  useEffect(() => {
    const handleTrophyUpdate = debounce((e: CustomEvent) => {
      const detail = (e as any).detail;
      if (detail?.postId === postId) {
        console.log('Trophy update event received', detail);
        
        // Use event detail for immediate UI feedback
        if (detail.active !== undefined) {
          setHasTrophy(detail.active);
        }
        
        if (detail.count !== undefined) {
          setTrophyCount(detail.count);
        }
        
        // Also refresh data from the server for consistency
        updateTrophyCount();
        
        // Refresh the post data in the cache
        queryClient.invalidateQueries({ queryKey: ['post', postId] });
      }
    }, 300);
    
    window.addEventListener('trophy-update', handleTrophyUpdate as EventListener);
    window.addEventListener('trophy-count-update', updateTrophyCount);
    
    return () => {
      window.removeEventListener('trophy-update', handleTrophyUpdate as EventListener);
      window.removeEventListener('trophy-count-update', updateTrophyCount);
    };
  }, [postId, queryClient, updateTrophyCount]);

  // Fetch and track likes/trophies whenever post ID changes
  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!user || !postId) return;
      
      try {
        console.log(`Checking like status for post ${postId}`);
        const { data } = await supabase
          .from('likes')
          .select('*')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        setLiked(!!data);
      } catch (error) {
        console.error("Error fetching like status:", error);
      }
    };
    
    const fetchLikesCount = async () => {
      if (!postId) return;
      
      try {
        console.log(`Fetching likes count for post ${postId}`);
        const { count, error } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true})
          .eq('post_id', postId);
        
        if (error) throw error;
        setLikesCount(count || 0);
      } catch (error) {
        console.error("Error fetching likes count:", error);
      }
    };
    
    const fetchTrophyStatus = async () => {
      if (!user || !postId) return;
      
      try {
        console.log(`Checking trophy status for post ${postId}`);
        const { data } = await supabase
          .from('clip_votes')
          .select('*')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        setHasTrophy(!!data);
      } catch (error) {
        console.error("Error fetching trophy status:", error);
      }
    };
    
    const fetchTrophyCount = async () => {
      if (!postId) return;
      
      try {
        console.log(`Fetching trophy count for post ${postId}`);
        const { count, error } = await supabase
          .from('clip_votes')
          .select('*', { count: 'exact', head: true})
          .eq('post_id', postId);
        
        if (error) throw error;
        setTrophyCount(count || 0);
      } catch (error) {
        console.error("Error fetching trophy count:", error);
      }
    };
    
    // Run all fetch operations in parallel
    Promise.all([
      fetchLikeStatus(),
      fetchLikesCount(),
      fetchTrophyStatus(),
      fetchTrophyCount()
    ]).catch(error => {
      console.error("Error in parallel fetches:", error);
    });
    
    // Set up debounced event listeners for real-time updates
    const handleLikeUpdate = debounce((e: CustomEvent) => {
      const detail = (e as any).detail;
      if (detail?.postId === postId) {
        console.log('Like update event received', detail);
        setLiked(detail.active);
        setLikesCount(detail.count);
      }
    }, 500);
    
    const handleTrophyUpdate = debounce((e: CustomEvent) => {
      const detail = (e as any).detail;
      if (detail?.postId === postId) {
        console.log('Trophy update event received', detail);
        setHasTrophy(detail.active);
        setTrophyCount(detail.count);
      }
    }, 500);
    
    // Global refresh event
    const handleGlobalUpdate = debounce(() => {
      console.log('Global update triggered, refreshing counts');
      Promise.all([
        fetchLikesCount(),
        fetchTrophyCount()
      ]).catch(error => {
        console.error("Error in refresh:", error);
      });
    }, 500);
    
    window.addEventListener('like-update', handleLikeUpdate as EventListener);
    window.addEventListener('trophy-update', handleTrophyUpdate as EventListener);
    window.addEventListener('trophy-count-update', handleGlobalUpdate);
    
    return () => {
      window.removeEventListener('like-update', handleLikeUpdate as EventListener);
      window.removeEventListener('trophy-update', handleTrophyUpdate as EventListener);
      window.removeEventListener('trophy-count-update', handleGlobalUpdate);
    };
  }, [postId, user]);

  // Load initial trophy status
  useEffect(() => {
    const showTrophyCount = async () => {
      if (!postId) return;

      try {
        // Only get count from clip_votes since we've consolidated trophy voting to a single table
        const { count: clipCount, error: clipCountError } = await supabase
          .from('clip_votes')
          .select('*', { count: 'exact', head: true})
          .eq('post_id', postId);
        
        if (clipCountError) {
          console.error('Error getting trophy count:', clipCountError);
          return;
        }
        
        const totalCount = clipCount || 0;
        console.log(`Trophy count for post ${postId}:`, totalCount);
        setTrophyCount(totalCount);
        
        // Check if the user has voted for this post
        if (user) {
          const { data: userVote, error: voteError } = await supabase
            .from('clip_votes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', user.id);
            
          if (voteError) {
            console.error('Error checking user vote:', voteError);
            return;
          }
          
          setHasTrophy(userVote && userVote.length > 0);
        }
      } catch (error) {
        console.error('Error in showTrophyCount:', error);
      }
    };

    showTrophyCount();
  }, [postId, user]);

  // Check if the current post is saved by the user
  useEffect(() => {
    const checkSaveStatus = async () => {
      if (!user || !postId) return;
      
      try {
        const { data, error } = await supabase
          .from('saved_videos')
          .select('id')
          .eq('user_id', user.id)
          .eq('post_id', postId)
          .maybeSingle();
          
        if (error && error.code !== 'PGRST116') {
          console.error('Error checking save status:', error);
          return;
        }
        
        setIsSaved(!!data);
      } catch (error) {
        console.error('Error checking if video is saved:', error);
      }
    };
    
    checkSaveStatus();
  }, [user, postId]);

  // Handle saving and unsaving videos
  const handleSaveVideo = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast.error("Please log in to save videos");
      return;
    }
    
    if (!postId) {
      toast.error("Cannot save this video");
      return;
    }
    
    if (saveLoading) return;
    
    // Optimistically update UI
    const newSaveState = !isSaved;
    setIsSaved(newSaveState);
    setSaveLoading(true);
    
    try {
      // Check if video is already saved
      const { data: existingSave, error: checkError } = await supabase
        .from('saved_videos')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .maybeSingle();
        
      if (checkError && !checkError.message.includes('does not exist')) {
        throw checkError;
      }
      
      if (existingSave) {
        // Unsave the video
        const { error: removeError } = await supabase
          .from('saved_videos')
          .delete()
          .eq('id', existingSave.id);
          
        if (removeError) throw removeError;
        
        toast.success("Video removed from saved clips");
      } else {
        // Save the video
        const { error: saveError } = await supabase
          .from('saved_videos')
          .insert({
            user_id: user.id,
            post_id: postId,
            video_url: post.video_url || '',
            title: post.title || 'Saved Video',
            saved_at: new Date().toISOString()
          });
          
        if (saveError) throw saveError;
        
        toast.success("Video saved to your profile");
      }
      
      // Only invalidate necessary queries
      queryClient.invalidateQueries({ queryKey: ['saved_videos', user.id] });
      
    } catch (error) {
      console.error('Error saving/unsaving video:', error);
      toast.error("Failed to save video");
      
      // Revert optimistic update on error
      setIsSaved(!newSaveState);
    } finally {
      setSaveLoading(false);
    }
  };

  const username = post.profiles?.username || 'Anonymous';
  const avatarUrl = post.profiles?.avatar_url;
  const gameName = post.games?.name;
  // Extract the original game ID from the UUID format
  const gameId = post.games?.id ? String(post.games.id).replace('00000000-0000-0000-0000-', '').replace(/^0+/, '') : '';

  // Early return if post data is invalid
  if (!post || !postId) {
    return (
      <div className="gaming-card p-4 text-red-500">
        Error: Invalid post data
      </div>
    );
  }

  return (
    <article 
      className={`relative w-full gaming-card transition-opacity duration-300 ${
        isLoading ? 'opacity-0' : 'opacity-100 animate-fade-in'
      } ${highlight ? 'ring-2 ring-blue-500' : ''}`}
      data-post-id={postId}
    >
      {/* User Header */}
      <div className="flex items-center justify-between p-4 border-b border-gaming-400/20">
        <div className="flex items-center space-x-3">
          <Avatar 
            className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-purple-500/50 transition-all duration-200"
            onClick={() => handleProfileClick(post.user_id)}
          >
            <AvatarImage src={avatarUrl || ''} alt={username} />
            <AvatarFallback>{username[0]?.toUpperCase() || '?'}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span 
              onClick={() => handleProfileClick(post.user_id)}
              className="text-base font-semibold text-gaming-100 hover:text-gaming-200 cursor-pointer"
            >
              {username}
            </span>
            {gameName && gameId && (
              <div className="mb-1">
                <span 
                  className="text-gaming-300 hover:text-gaming-100 cursor-pointer text-sm"
                  onClick={(e) => handleGameClick(e, gameId, gameName)} 
                >
                  Playing {gameName}
                </span>
              </div>
            )}
          </div>
        </div>
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger className="p-2 hover:bg-gaming-800 rounded-full transition-colors">
              <MoreVertical className="h-5 w-5 text-gaming-300" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                className="text-red-500 focus:text-red-400 cursor-pointer"
                onClick={handleDeletePost}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Post Content */}
      <div className="w-full">
        <PostContent
          imageUrl={post.image_url}
          videoUrl={post.video_url}
          postId={postId}
        />
      </div>

      {/* Interaction Counts */}
      <div className="flex justify-around py-3 border-t border-gaming-400/20">
        <button 
          className="like-button flex items-center text-sm font-medium transition-all duration-200 group"
          onClick={handleLike}
          disabled={likeLoading}
        >
          <Heart 
            className={`h-6 w-6 ${liked ? 'text-red-500' : 'text-gray-400 group-hover:text-red-500'} transition-transform duration-200 group-hover:scale-110 group-active:scale-90`}
            fill={liked ? "currentColor" : "none"}
          />
          <span className={`text-base font-medium ${liked ? 'text-red-500' : 'text-gray-400 group-hover:text-red-500'}`}>
            {likesCount}
          </span>
        </button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button 
              className="comment-button flex items-center text-sm font-medium text-gray-400 hover:text-blue-500 transition-all duration-200 group"
              onClick={handleComment}
            >
              <MessageSquare 
                className="h-6 w-6 text-blue-400 group-hover:text-blue-300 transition-transform duration-200 group-hover:scale-110 group-active:scale-90" 
              />
              <span className="text-base font-medium text-gray-400 group-hover:text-blue-300">
                {commentsCount}
              </span>
            </button>
          </DialogTrigger>
          <DialogContent className="bg-[#1D1E2A] border-[#2C2D41] text-white p-4 max-w-md mx-auto">
            <h3 className="text-lg font-bold mb-3">Add Comment</h3>
            <p className="text-sm text-gray-400 mb-4">Commenting on post from {post.profiles?.username || 'user'}</p>
            
            <Textarea
              placeholder="Write your comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="bg-[#252636] border-[#333442] text-white min-h-[100px] mb-4"
            />
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                className="border-[#3F4252] text-gray-300 hover:bg-[#2C2D41]"
              >
                Cancel
              </Button>
              <Button 
                onClick={submitComment}
                disabled={isSubmitting || !commentText.trim()}
                className="bg-[#6366F1] hover:bg-[#4F46E5] text-white"
              >
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <button 
          className="trophy-button flex items-center text-sm font-medium text-gray-400 hover:text-yellow-500 transition-all duration-200 group"
          onClick={handleTrophyVote}
          disabled={trophyLoading}
          aria-label={hasTrophy ? "Remove rank" : "Rank up clip"}
        >
          <Trophy 
            className={`h-6 w-6 ${hasTrophy ? 'text-yellow-500 fill-yellow-500' : 'text-yellow-500'} transition-all ${trophyLoading ? 'opacity-50' : ''}`}
          />
          <span className={`text-base font-medium ml-1 ${hasTrophy ? 'text-yellow-500' : 'text-gray-400 group-hover:text-yellow-500'}`}>
            {post.rank || trophyCount || 0}
          </span>
        </button>
        
        {/* Always show the share button */}
        <ShareButton postId={post.id} className="share-button" />
        
        <button 
          className="save-button flex items-center text-sm font-medium text-gray-400 hover:text-blue-500 transition-all duration-200 group"
          onClick={handleSaveVideo}
          disabled={saveLoading}
          aria-label={isSaved ? "Remove from saved videos" : "Save video"}
        >
          <Bookmark 
            className={`h-6 w-6 ${isSaved ? 'text-blue-500 fill-blue-500' : 'text-gray-400 group-hover:text-blue-500'} transition-transform duration-200 group-hover:scale-110 group-active:scale-90`}
            fill={isSaved ? "currentColor" : "none"}
          />
        </button>
      </div>

      {/* Caption */}
      {post.content && (
        <div className="px-4 py-3 border-t border-gaming-400/20">
          <p className="text-base text-gaming-100">
            <span className="font-semibold hover:text-gaming-200 cursor-pointer" onClick={() => handleProfileClick(post.user_id)}>
              {username}
            </span>
            {' '}
            <span className="text-gaming-200">{post.content}</span>
          </p>
        </div>
      )}

      {/* Inline Comments Section - Showing limited comments by default */}
      {!showComments && (
        <InlineComments 
          postId={postId}
          maxComments={3}
          onViewAllClick={handleCommentClick}
        />
      )}

      {/* Full Comments Section - shown when expanded */}
      {showComments && (
        <div className="border-t border-gaming-400/20">
          {postId ? (
            <CommentList 
              postId={postId}
              onCommentAdded={() => {
                // Refresh comment count
                queryClient.invalidateQueries({ queryKey: ['comments-count', postId] });
              }}
              className="comments-section"
              key={`comments-${postId}`} // Force re-render with key
            />
          ) : (
            <div className="p-4 text-center text-red-500">
              Error: Cannot identify post
            </div>
          )}
        </div>
      )}
    </article>
  );
};

export default PostItem;
