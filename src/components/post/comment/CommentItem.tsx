
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal } from "lucide-react";
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
}

export const CommentItem = ({ comment }: CommentItemProps) => {
  const { openReportDialog } = useReportDialog();

  const handleReport = (commentId: string) => {
    openReportDialog(commentId, 'comment');
  };

  return (
    <div className="flex space-x-3">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={comment.profiles.avatar_url} />
        <AvatarFallback className="bg-white/10 text-white">
          {comment.profiles.username[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-start justify-between">
          <div>
            <span className="font-semibold text-sm text-white">
              {comment.profiles.username}
            </span>
            <span className="ml-2 text-sm text-white/90">{comment.content}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/50 hover:text-white"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#2A2F3C] border-white/10">
              <DropdownMenuItem
                onClick={() => handleReport(comment.id)}
                className="text-red-400 focus:text-red-400 focus:bg-white/5"
              >
                Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center space-x-4 text-xs text-white/50">
          <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
          {comment.likes_count > 0 && (
            <span>{comment.likes_count} likes</span>
          )}
          <button className="font-semibold hover:text-white/70">Reply</button>
          <button className="font-semibold hover:text-white/70">Like</button>
        </div>
      </div>
    </div>
  );
};
