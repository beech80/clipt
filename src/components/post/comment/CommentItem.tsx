
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Heart, MoreHorizontal, MessageSquare } from "lucide-react";
import { useReportDialog } from "@/hooks/use-report-dialog";
import { useState } from "react";
import { CommentForm } from "./CommentForm";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  parent_id?: string | null;
  likes_count: number;
  profiles: {
    username: string;
    avatar_url: string;
  };
  replies?: Comment[];
  user_id: string;
}

interface CommentItemProps {
  comment: Comment;
  postId: string;
  level?: number;
}

export const CommentItem = ({ comment, postId, level = 0 }: CommentItemProps) => {
  const { openReportDialog } = useReportDialog();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const maxLevel = 2;
  const [isLiked, setIsLiked] = useState(false);

  const handleReport = (commentId: string) => {
    openReportDialog(commentId, 'comment');
  };

  const handleLike = async () => {
    if (!user) {
      toast.error("Please login to like comments");
      return;
    }

    try {
      const { error } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: comment.id,
          user_id: user.id
        });

      if (error) {
        if (error.code === '23505') {
          await supabase
            .from('comment_likes')
            .delete()
            .match({ comment_id: comment.id, user_id: user.id });
          setIsLiked(false);
        } else {
          throw error;
        }
      } else {
        setIsLiked(true);
      }

      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      toast.success(isLiked ? 'Comment unliked' : 'Comment liked');
    } catch (error) {
      toast.error("Error updating like");
    }
  };

  return (
    <div className="group" style={{ marginLeft: level > 0 ? `${level * 24}px` : '0' }}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-[#9b87f5]/20">
          <AvatarImage src={comment.profiles.avatar_url} />
          <AvatarFallback className="bg-[#1e2230] text-white">
            {comment.profiles.username[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="inline-flex items-start gap-2">
                <div className="bg-[#1e2230] rounded-2xl px-4 py-2">
                  <span className="font-semibold text-sm text-[#9b87f5] mr-2">
                    {comment.profiles.username}
                  </span>
                  <span className="text-sm text-gray-300">{comment.content}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                <button 
                  onClick={handleLike}
                  className="flex items-center gap-1 font-semibold hover:text-[#9b87f5] transition-colors"
                >
                  <Heart className={`h-3 w-3 ${isLiked ? 'fill-[#9b87f5] text-[#9b87f5]' : ''}`} />
                  {comment.likes_count > 0 && (
                    <span>{comment.likes_count}</span>
                  )}
                </button>
                <button 
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="flex items-center gap-1 font-semibold hover:text-[#9b87f5] transition-colors"
                >
                  <MessageSquare className="h-3 w-3" />
                  Reply
                </button>
              </div>
              {showReplyForm && (
                <div className="mt-3">
                  <CommentForm 
                    postId={postId}
                    parentId={comment.id}
                    onReplyComplete={() => setShowReplyForm(false)}
                    onCancel={() => setShowReplyForm(false)}
                  />
                </div>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-[#1e2230] border-[#9b87f5]/20">
                <DropdownMenuItem
                  onClick={() => handleReport(comment.id)}
                  className="text-red-400 focus:text-red-400 focus:bg-red-400/10"
                >
                  Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && level < maxLevel && (
        <div className="ml-11 mt-3">
          {showReplies ? (
            <div className="space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  level={level + 1}
                />
              ))}
            </div>
          ) : null}
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="text-xs text-[#9b87f5] font-semibold mt-2 hover:text-[#8b77e5] transition-colors"
          >
            {showReplies ? 'Hide replies' : `View ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}
          </button>
        </div>
      )}
    </div>
  );
};
