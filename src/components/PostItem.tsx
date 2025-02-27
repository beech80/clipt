
import React, { useState, useEffect } from "react";
import PostContent from "./post/PostContent";
import { useNavigate } from "react-router-dom";
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
import CommentList from "./post/CommentList";
import { Button } from "./ui/button";

interface PostItemProps {
  post: Post;
}

const PostItem = ({ post }: PostItemProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const isOwner = user?.id === post.user_id;
  const [showComments, setShowComments] = useState(false);
  const queryClient = useQueryClient();

  // Log the post ID for debugging
  useEffect(() => {
    console.log("PostItem with ID:", post.id);
  }, [post.id]);

  const { data: commentsCount = 0 } = useQuery({
    queryKey: ['comments-count', post.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);
      return count || 0;
    }
  });

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const handleDeletePost = async () => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)
        .eq('user_id', user?.id); // Extra safety check

      if (error) throw error;
      
      toast.success('Post deleted successfully');
      // Optionally force a page refresh to update the feed
      window.location.reload();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleCommentClick = () => {
    console.log("Comment button clicked for post:", post.id);
    setShowComments(!showComments);
  };

  const handleProfileClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const username = post.profiles?.username || 'Anonymous';
  const avatarUrl = post.profiles?.avatar_url;
  const gameName = post.games?.name;

  return (
    <article className={`relative w-full gaming-card transition-opacity duration-300 ${
      isLoading ? 'opacity-0' : 'opacity-100 animate-fade-in'
    }`}>
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
              className="text-base font-semibold text-gaming-100 hover:text-gaming-200 transition-all duration-200 cursor-pointer"
            >
              {username}
            </span>
            {gameName && (
              <span className="text-sm text-gaming-300">
                {gameName}
              </span>
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
          postId={post.id}
        />
      </div>

      {/* Interaction Counts */}
      <div className="px-4 py-3 flex items-center space-x-6 border-t border-gaming-400/20">
        <div className="flex items-center space-x-2 group transition-all duration-200 hover:scale-110 active:scale-95">
          <Heart 
            className="h-6 w-6 text-red-500 group-hover:text-red-400 transition-colors group-active:scale-90" 
            fill={post.likes_count ? "currentColor" : "none"}
          />
          <span className="text-base font-medium text-gaming-100 group-hover:text-red-400 transition-colors">
            {post.likes_count || 0}
          </span>
        </div>
        <Button
          variant="ghost"
          className="flex items-center space-x-2 group transition-all duration-200 hover:scale-110 active:scale-95 p-0"
          onClick={handleCommentClick}
        >
          <MessageSquare 
            className="h-6 w-6 text-blue-400 group-hover:text-blue-300 transition-colors group-active:scale-90"
          />
          <span className="text-base font-medium text-gaming-100 group-hover:text-blue-300 transition-colors">
            {commentsCount}
          </span>
        </Button>
        <div className="flex items-center space-x-2 group transition-all duration-200 hover:scale-110 active:scale-95">
          <Trophy 
            className="h-6 w-6 text-yellow-500 group-hover:text-yellow-400 transition-colors group-active:scale-90"
            fill={post.clip_votes?.[0]?.count ? "currentColor" : "none"}
          />
          <span className="text-base font-medium text-gaming-100 group-hover:text-yellow-400 transition-colors">
            {post.clip_votes?.[0]?.count || 0}
          </span>
        </div>
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

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gaming-400/20">
          <CommentList 
            postId={typeof post.id === 'string' ? post.id : String(post.id)} 
            onBack={() => setShowComments(false)} 
          />
        </div>
      )}
    </article>
  );
};

export default PostItem;
