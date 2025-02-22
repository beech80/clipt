
import { useState, useEffect } from "react";
import PostContent from "./post/PostContent";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Post } from "@/types/post";
import { Heart, MessageSquare, Trophy } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { useQuery } from "@tanstack/react-query";

interface PostItemProps {
  post: Post;
}

const PostItem = ({ post }: PostItemProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

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

  const handleCommentClick = () => {
    navigate(`/comments/${post.id}`);
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
            className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-purple-500/50 transition-all duration-200"
            onClick={() => handleProfileClick(post.user_id)}
          >
            <AvatarImage src={avatarUrl || ''} alt={username} />
            <AvatarFallback>{username[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span 
              onClick={() => handleProfileClick(post.user_id)}
              className="text-sm font-semibold text-gaming-100 hover:text-gaming-200 transition-all duration-200 cursor-pointer"
            >
              {username}
            </span>
            {gameName && (
              <span className="text-xs text-gaming-300">
                {gameName}
              </span>
            )}
          </div>
        </div>
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
        <div className="flex items-center space-x-1 group transition-all duration-200 hover:scale-110 active:scale-95">
          <Heart 
            className="h-5 w-5 text-red-500 group-hover:text-red-400 transition-colors group-active:scale-90" 
            fill={post.likes_count ? "currentColor" : "none"}
          />
          <span className="text-sm font-medium text-gaming-100 group-hover:text-red-400 transition-colors">
            {post.likes_count || 0}
          </span>
        </div>
        <div className="flex items-center space-x-1 group transition-all duration-200 hover:scale-110 active:scale-95">
          <MessageSquare 
            className="h-5 w-5 text-blue-400 group-hover:text-blue-300 transition-colors group-active:scale-90"
            onClick={handleCommentClick}
          />
          <span className="text-sm font-medium text-gaming-100 group-hover:text-blue-300 transition-colors">
            {commentsCount}
          </span>
        </div>
        <div className="flex items-center space-x-1 group transition-all duration-200 hover:scale-110 active:scale-95">
          <Trophy 
            className="h-5 w-5 text-yellow-500 group-hover:text-yellow-400 transition-colors group-active:scale-90"
            fill={post.clip_votes?.[0]?.count ? "currentColor" : "none"}
          />
          <span className="text-sm font-medium text-gaming-100 group-hover:text-yellow-400 transition-colors">
            {post.clip_votes?.[0]?.count || 0}
          </span>
        </div>
      </div>

      {/* Caption */}
      {post.content && (
        <div className="px-4 py-3 border-t border-gaming-400/20">
          <p className="text-sm text-gaming-100">
            <span className="font-semibold hover:text-gaming-200 cursor-pointer" onClick={() => handleProfileClick(post.user_id)}>
              {username}
            </span>
            {' '}
            <span className="text-gaming-200">{post.content}</span>
          </p>
        </div>
      )}
    </article>
  );
};

export default PostItem;
