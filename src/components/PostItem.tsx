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

interface PostItemProps {
  post: Post;
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
    <div className="relative h-full w-full bg-[#1A1F2C] touch-none select-none">
      <div className="absolute inset-0 flex flex-col">
        <div className="p-3 sm:p-4 bg-[#1A1F2C] border-b border-[#2A2E3B]">
          <PostHeader post={post} commentsCount={commentsCount} />
        </div>

        <div className="flex-1 relative">
          <PostContent
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