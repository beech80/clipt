import { useState, useEffect } from "react";
import PostContent from "./post/PostContent";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { PostInteractions } from "./post/interactions/PostInteractions";
import { Post } from "@/types/post";
import { Heart, MessageSquare, Trophy } from "lucide-react";

interface PostItemProps {
  post: Post;
}

const PostItem = ({ post }: PostItemProps) => {
  const navigate = useNavigate();
  const [commentsCount, setCommentsCount] = useState(0);

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

  const username = post.profiles?.username || 'Anonymous';

  return (
    <div className="relative h-full w-full bg-[#1A1F2C] touch-none select-none">
      <div className="absolute inset-0 flex flex-col">
        {/* Simplified Header */}
        <div className="flex items-center justify-between p-4 border-b border-gaming-600/30 bg-gaming-800/90">
          <span className="text-lg font-bold text-gaming-100">{username}</span>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Heart className="h-5 w-5 text-red-500" />
              <span className="text-sm font-bold text-gaming-100">
                {post.likes_count || 0}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageSquare className="h-5 w-5 text-gaming-400" />
              <span className="text-sm font-bold text-gaming-100">
                {commentsCount}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-bold text-gaming-100">
                {post.clip_votes?.[0]?.count || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 relative">
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
      </div>
    </div>
  );
};

export default PostItem;