
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Heart, MoreHorizontal } from "lucide-react";
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
        if (error.code === '23505') { // Unique violation
          await supabase
            .from('comment_likes')
            .delete()
            .match({ comment_id: comment.id, user_id: user.id });
        } else {
          throw error;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    } catch (error) {
      toast.error("Error updating like");
    }
  };

  return (
    <div className="group">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment.profiles.avatar_url} />
          <AvatarFallback>
            {comment.profiles.username[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="inline-flex items-start gap-2">
                <div className="bg-gray-100 rounded-2xl px-4 py-2">
                  <span className="font-semibold text-sm mr-2">{comment.profiles.username}</span>
                  <span className="text-sm">{comment.content}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                {comment.likes_count > 0 && (
                  <span>{comment.likes_count} likes</span>
                )}
                <button 
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="font-semibold hover:text-gray-700"
                >
                  Reply
                </button>
                <button 
                  onClick={handleLike}
                  className="font-semibold hover:text-gray-700"
                >
                  Like
                </button>
              </div>
              {showReplyForm && (
                <div className="mt-2">
                  <CommentForm 
                    postId={postId}
                    parentId={comment.id}
                    onReplyComplete={() => setShowReplyForm(false)}
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
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() => handleReport(comment.id)}
                  className="text-red-600 focus:text-red-600"
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
        <div className="ml-11 mt-2">
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
            className="text-xs text-gray-500 font-semibold mt-2 hover:text-gray-700"
          >
            {showReplies ? 'Hide replies' : `View ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}
          </button>
        </div>
      )}
    </div>
  );
};
