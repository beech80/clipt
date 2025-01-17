import { useState, useEffect } from "react";
import PostContent from "./post/PostContent";
import { useAuth } from "@/contexts/AuthContext";
import { Flag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useReportDialog } from "@/hooks/use-report-dialog";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PostHeader } from "./post/PostHeader";
import { PostActions } from "./post/PostActions";
import { Post } from "@/types/post";
import { Badge } from "./ui/badge";

interface PostItemProps {
  post: Post & {
    categories?: { name: string; slug: string; }[];
  };
}

const PostItem = ({ post }: PostItemProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [commentsCount, setCommentsCount] = useState(0);
  const { openReportDialog } = useReportDialog();

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

  const handleReport = () => {
    openReportDialog(post.id, 'post');
  };

  return (
    <div className="relative h-full w-full bg-[#1A1F2C]">
      <div className="absolute inset-0 flex flex-col">
        <div className="p-4 bg-[#1A1F2C] border-b border-[#2A2E3B]">
          <PostHeader post={post} commentsCount={commentsCount} />
          {post.categories && post.categories.length > 0 && (
            <div className="flex gap-2 mt-2">
              {post.categories.map((category) => (
                <Badge 
                  key={category.slug}
                  variant="secondary" 
                  className="bg-[#2A2E3B] text-[#9b87f5]"
                >
                  {category.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 relative">
          <PostContent
            content={post.content}
            imageUrl={post.image_url}
            videoUrl={post.video_url}
            postId={post.id}
          />
        </div>

        <PostActions 
          post={post} 
          commentsCount={commentsCount} 
          onCommentClick={handleCommentClick}
        />
      </div>
    </div>
  );
};

export default PostItem;