import React, { useState, useEffect } from "react";
import PostContent from "./post/PostContent";
import { supabase } from "@/lib/supabase";
import { Post } from "@/types/post";
import { Heart, MessageSquare, Trophy, Trash2, MoreVertical } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommentList } from "./post/CommentList"; 
import { Button } from "./ui/button";

interface PostItemProps {
  post: Post;
  onCommentClick?: () => void;
  highlight?: boolean;
  'data-post-id'?: string;
}

const PostItem: React.FC<PostItemProps> = ({ post, onCommentClick, highlight = false, 'data-post-id': postIdAttr }) => {
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const isOwner = user?.id === post.user_id;
  const [showComments, setShowComments] = useState(false);
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

  // Fetch comment count
  const { data: commentsCount = 0 } = useQuery({
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

  const handleCommentClick = () => {
    console.log("Comment button clicked for post:", postId);
    if (onCommentClick) {
      onCommentClick();
    } else {
      setShowComments(!showComments);
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

  const handleLikeClick = async () => {
    if (!user) {
      toast.error('Please sign in to like posts');
      return;
    }

    try {
      const { data: existingLike, error: checkError } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingLike) {
        // Unlike the post
        const { error: unlikeError } = await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id);

        if (unlikeError) throw unlikeError;
        
        toast.success('Post unliked');
      } else {
        // Like the post
        const { error: likeError } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id,
          });

        if (likeError) throw likeError;
        
        toast.success('Post liked');
        
        // Send notification to post owner if it's not the current user
        if (post.user_id !== user.id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: post.user_id,
              actor_id: user.id,
              type: 'like',
              post_id: postId,
              read: false
            });
        }
      }

      // Refresh post data
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    } catch (error) {
      console.error('Error handling like:', error);
      toast.error('Failed to update like status');
    }
  };

  const handleTrophyClick = async () => {
    if (!user) {
      toast.error('Please sign in to give a trophy');
      return;
    }

    try {
      const { data: existingVote, error: checkError } = await supabase
        .from('clip_votes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingVote) {
        // Remove trophy vote
        const { error: removeError } = await supabase
          .from('clip_votes')
          .delete()
          .eq('id', existingVote.id);

        if (removeError) throw removeError;
        
        toast.success('Trophy removed');
      } else {
        // Add trophy vote
        const { error: voteError } = await supabase
          .from('clip_votes')
          .insert({
            post_id: postId,
            user_id: user.id,
            value: 1
          });

        if (voteError) throw voteError;
        
        toast.success('Trophy awarded!');
        
        // Send notification to post owner
        if (post.user_id !== user.id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: post.user_id,
              actor_id: user.id,
              type: 'trophy',
              post_id: postId,
              read: false
            });
        }
      }

      // Refresh post data
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    } catch (error) {
      console.error('Error handling trophy vote:', error);
      toast.error('Failed to update trophy status');
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
      className="bg-gray-900 border border-gray-800 rounded-md mb-4"
      data-post-id={postIdAttr || post.id}
    >
      {/* User Header */}
      <div className="flex items-center p-3">
        <Avatar 
          className="h-8 w-8 mr-2"
          onClick={() => handleProfileClick(post.user_id)}
        >
          <AvatarImage src={avatarUrl || ''} alt={username} />
          <AvatarFallback>{username[0]?.toUpperCase() || '?'}</AvatarFallback>
        </Avatar>
        <span 
          onClick={() => handleProfileClick(post.user_id)}
          className="font-medium text-white cursor-pointer"
        >
          {username}
        </span>
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger className="ml-auto p-1">
              <MoreVertical className="h-4 w-4 text-gray-400" />
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

      {/* Caption */}
      {post.content && (
        <div className="px-3 py-2">
          <p className="text-sm text-white">
            {post.content}
          </p>
        </div>
      )}
      
      {/* Post Content */}
      <div className="w-full">
        <PostContent
          imageUrl={post.image_url}
          videoUrl={post.video_url}
          postId={postId}
        />
      </div>

      {/* Interaction Counts */}
      <div className="flex justify-between p-3 text-sm">
        <div className="flex items-center text-red-500">
          <Heart 
            className="h-4 w-4 mr-1" 
            fill="currentColor"
          />
          <span>{post.likes_count || 0}</span>
        </div>
        
        <div className="flex items-center text-blue-500">
          <MessageSquare 
            className="h-4 w-4 mr-1"
          />
          <span>{commentsCount}</span>
        </div>
        
        <div className="flex items-center text-yellow-500">
          <Trophy 
            className="h-4 w-4 mr-1"
            fill="currentColor"
          />
          <span>{post.clip_votes?.[0]?.count || 0}</span>
        </div>
      </div>

      {/* Comments Section - Make sure postId is valid and passed correctly */}
      {showComments && (
        <div className="border-t border-gaming-400/20">
          <CommentList postId={postId} />
        </div>
      )}
    </article>
  );
};

export default PostItem;
