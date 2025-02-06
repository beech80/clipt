
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Heart, MoreHorizontal } from "lucide-react";
import { useReportDialog } from "@/hooks/use-report-dialog";
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
}

interface CommentItemProps {
  comment: Comment;
  showReplies?: boolean;
}

export const CommentItem = ({ comment, showReplies = true }: CommentItemProps) => {
  const { openReportDialog } = useReportDialog();

  const handleReport = (commentId: string) => {
    openReportDialog(commentId, 'comment');
  };

  return (
    <div className="flex gap-3 group">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={comment.profiles.avatar_url} />
        <AvatarFallback className="bg-white/10">
          {comment.profiles.username[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-sm">{comment.profiles.username}</span>
              <span className="text-sm">{comment.content}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
              {comment.likes_count > 0 && (
                <span>{comment.likes_count} likes</span>
              )}
              <button className="font-semibold hover:text-gray-700">Reply</button>
              <button className="font-semibold hover:text-gray-700">Like</button>
            </div>
            {showReplies && (
              <button className="text-xs text-gray-500 font-semibold mt-1">
                Hide replies
              </button>
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
  );
};
