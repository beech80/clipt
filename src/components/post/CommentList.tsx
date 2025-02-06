
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Heart, MoreHorizontal, Loader2, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
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

interface CommentListProps {
  postId: string;
  onBack: () => void;
}

const CommentList = ({ postId, onBack }: CommentListProps) => {
  const [newComment, setNewComment] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { openReportDialog } = useReportDialog();

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Comment[];
    }
  });

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to comment");
      return;
    }

    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          content: newComment.trim(),
          post_id: postId,
          user_id: user.id
        });

      if (error) throw error;

      toast.success("Comment added successfully!");
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    } catch (error) {
      toast.error("Error adding comment");
    }
  };

  const handleReport = (commentId: string) => {
    openReportDialog(commentId, 'comment');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="w-full max-w-lg bg-[#1A1F2C] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="hover:bg-white/5"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </Button>
            <h1 className="text-lg font-semibold text-white">Add Comment</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="hover:bg-white/5"
          >
            <X className="h-5 w-5 text-white" />
          </Button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-white/50" />
            </div>
          ) : comments?.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-white/70">No comments yet</p>
              <p className="text-white/50 text-sm">Be the first to comment</p>
            </div>
          ) : (
            <div className="py-4 px-4 space-y-4">
              {comments?.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
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
              ))}
            </div>
          )}
        </div>

        {/* Comment input */}
        <div className="border-t border-white/10 p-4">
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <Textarea
              placeholder="Write your comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px] bg-[#2A2F3C] border-purple-500/50 focus-visible:ring-purple-500/30 text-white placeholder:text-white/50 resize-none rounded-lg"
            />
            <div className="flex justify-end gap-3">
              <Button 
                type="button"
                onClick={onBack}
                variant="ghost"
                className="text-white hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-purple-500 hover:bg-purple-600 text-white"
                disabled={!newComment.trim()}
              >
                Post Comment
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CommentList;
