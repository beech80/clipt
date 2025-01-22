import { useState, useEffect, memo } from "react";
import PostContent from "./post/PostContent";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { PostInteractions } from "./post/interactions/PostInteractions";
import { Post } from "@/types/post";
import { Heart, MessageSquare, Trophy } from "lucide-react";

interface PostItemProps {
  post: Post;
}

const PostItem = memo(({ post }: PostItemProps) => {
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
    <div className="relative w-full bg-card/50 backdrop-blur-sm rounded-lg overflow-hidden shadow-lg transition-shadow hover:shadow-xl border border-border/50">
      <div className="absolute inset-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center space-x-3">
            <span className="text-lg font-semibold text-foreground hover:text-primary transition-colors">
              {username}
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-1">
              <Heart className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium text-foreground">
                {post.likes_count || 0}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {commentsCount}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium text-foreground">
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
          />
        </div>

        {/* Interactions */}
        <PostInteractions 
          post={post} 
          commentsCount={commentsCount} 
          onCommentClick={handleCommentClick}
        />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.likes_count === nextProps.post.likes_count &&
    prevProps.post.clip_votes?.[0]?.count === nextProps.post.clip_votes?.[0]?.count
  );
});

PostItem.displayName = 'PostItem';

export default PostItem;