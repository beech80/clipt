import { useState, useEffect } from "react";
import PostContent from "./post/PostContent";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { PostInteractions } from "./post/interactions/PostInteractions";
import { Post } from "@/types/post";
import { Heart, MessageSquare, Trophy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

interface PostItemProps {
  post: Post;
}

const PostItem = ({ post }: PostItemProps) => {
  const navigate = useNavigate();
  const [commentsCount, setCommentsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isTrophied, setIsTrophied] = useState(false);

  useEffect(() => {
    const fetchCommentsCount = async () => {
      const { count } = await supabase
        .from('comments')
        .select('*', { count: 'exact' })
        .eq('post_id', post.id);
      setCommentsCount(count || 0);
    };
    fetchCommentsCount();
  }, [post.id]);

  const handleCommentClick = () => {
    navigate(`/comments/${post.id}`);
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.profiles?.username) {
      navigate(`/profile/${post.profiles.username}`);
    }
  };

  const username = post.profiles?.username || 'Anonymous';

  return (
    <div className="relative w-full gaming-card">
      <div className="absolute inset-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gaming-400/20 backdrop-blur-sm bg-gaming-800/80">
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleProfileClick}
              className="flex items-center space-x-2 group hover:scale-105 transition-transform"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gaming-500 group-hover:border-gaming-400 transition-colors">
                <img
                  src={post.profiles?.avatar_url || "/placeholder.svg"}
                  alt={username}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-lg font-semibold text-gaming-100 group-hover:text-gaming-200 transition-colors">
                {username}
              </span>
            </button>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-1 group cursor-pointer hover:scale-110 transition-transform">
              <Heart className={cn(
                "h-5 w-5 transition-colors",
                isLiked ? "text-red-500 fill-current" : "text-gaming-400 group-hover:text-red-400"
              )} />
              <span className="text-sm font-medium text-gaming-100">
                {post.likes_count || 0}
              </span>
            </div>
            <div className="flex items-center space-x-1 group cursor-pointer hover:scale-110 transition-transform">
              <MessageSquare className="h-5 w-5 text-gaming-400 group-hover:text-gaming-300" />
              <span className="text-sm font-medium text-gaming-100">
                {commentsCount}
              </span>
            </div>
            <div className="flex items-center space-x-1 group cursor-pointer hover:scale-110 transition-transform">
              <Trophy className={cn(
                "h-5 w-5 transition-colors",
                isTrophied ? "text-yellow-500 fill-current" : "text-gaming-400 group-hover:text-yellow-400"
              )} />
              <span className="text-sm font-medium text-gaming-100">
                {post.clip_votes?.[0]?.count || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative">
          <PostContent
            imageUrl={post.image_url}
            videoUrl={post.video_url}
            postId={post.id}
            onLike={() => setIsLiked(!isLiked)}
          />
        </div>

        {/* Interactions */}
        <PostInteractions 
          post={post} 
          commentsCount={commentsCount} 
          onCommentClick={handleCommentClick}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          isLiked={isLiked}
          setIsLiked={setIsLiked}
          isTrophied={isTrophied}
          setIsTrophied={setIsTrophied}
        />
      </div>
    </div>
  );
};

export default PostItem;