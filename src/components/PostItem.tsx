
import { useState, useEffect } from "react";
import PostContent from "./post/PostContent";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { PostInteractions } from "./post/interactions/PostInteractions";
import { Post } from "@/types/post";
import { Heart, MessageSquare, Trophy } from "lucide-react";
import { CommentList } from "./post/CommentList";

interface PostItemProps {
  post: Post;
}

const PostItem = ({ post }: PostItemProps) => {
  const navigate = useNavigate();
  const [commentsCount, setCommentsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    const fetchCommentsCount = async () => {
      const { count } = await supabase
        .from('comments')
        .select('*', { count: 'exact' })
        .eq('post_id', post.id);
      setCommentsCount(count || 0);
      setIsLoading(false);
    };
    fetchCommentsCount();
  }, [post.id]);

  const handleCommentClick = () => {
    setShowComments(!showComments);
  };

  const handleProfileClick = (username: string) => {
    navigate(`/profile/${username}`);
  };

  const handlePostClick = () => {
    navigate(`/post/${post.id}`);
  };

  const username = post.profiles?.username || 'Anonymous';

  return (
    <div className={`relative w-full gaming-card transition-opacity duration-300 ${
      isLoading ? 'opacity-0' : 'opacity-100 animate-fade-in'
    }`}>
      <div className="absolute inset-0 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gaming-400/20 backdrop-blur-sm bg-gaming-800/80">
          <div className="flex items-center space-x-3">
            <span 
              onClick={() => handleProfileClick(username)}
              className="text-lg font-semibold text-gaming-100 hover:text-gaming-200 transition-all duration-200 hover:scale-105 transform cursor-pointer"
            >
              {username}
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-1 group transition-all duration-200 hover:scale-110 active:scale-95">
              <Heart className="h-5 w-5 text-red-500 group-hover:text-red-400 transition-colors group-active:scale-90" 
                    fill={post.likes_count ? "currentColor" : "none"} />
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
              <Trophy className="h-5 w-5 text-yellow-500 group-hover:text-yellow-400 transition-colors group-active:scale-90" 
                     fill={post.clip_votes?.[0]?.count ? "currentColor" : "none"} />
              <span className="text-sm font-medium text-gaming-100 group-hover:text-yellow-400 transition-colors">
                {post.clip_votes?.[0]?.count || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 relative cursor-pointer" onClick={handlePostClick}>
          <PostContent
            imageUrl={post.image_url}
            videoUrl={post.video_url}
            postId={post.id}
          />
        </div>

        <PostInteractions 
          post={post} 
          commentsCount={commentsCount} 
          onCommentClick={handleCommentClick}
        />

        {showComments && (
          <div className="border-t border-gaming-400/20 bg-gaming-800/80">
            <CommentList postId={post.id} onBack={() => setShowComments(false)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PostItem;
