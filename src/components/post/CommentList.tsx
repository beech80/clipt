
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MessageSquare, Loader2, Flag, X } from "lucide-react";
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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="w-full max-w-lg bg-[#1a1b1e] min-h-screen md:min-h-[80vh] md:rounded-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#1a1b1e]/90 backdrop-blur supports-[backdrop-filter]:bg-[#1a1b1e]/60 border-b border-white/10 px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="hover:bg-white/10 text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-white/60" />
                <h1 className="text-lg font-semibold text-white">Comments</h1>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="hover:bg-white/10 text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <Loader2 className="w-8 h-8 animate-spin text-white/60" />
              </div>
            ) : comments?.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare className="w-12 h-12 mx-auto text-white/20 mb-3" />
                <p className="text-white/60">No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments?.map((comment) => (
                  <div 
                    key={comment.id} 
                    className="group flex items-start gap-3 p-3 rounded hover:bg-white/5 transition-colors"
                  >
                    <Avatar className="w-8 h-8 border border-white/10">
                      <AvatarImage src={comment.profiles.avatar_url} />
                      <AvatarFallback className="bg-white/10 text-white">
                        {comment.profiles.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {comment.profiles.username}
                          </span>
                          <span className="text-sm text-white/40">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 hover:bg-white/10"
                            >
                              <Flag className="h-4 w-4 text-white/60" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1a1b1e]/90 border-white/10">
                            <DropdownMenuItem 
                              onClick={() => handleReport(comment.id)}
                              className="text-white hover:bg-white/10"
                            >
                              Report Comment
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-white mt-1 break-words">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Comment input */}
        <div className="bg-[#1a1b1e]/90 backdrop-blur supports-[backdrop-filter]:bg-[#1a1b1e]/60 border-t border-white/10 p-4 sticky bottom-0">
          <form onSubmit={handleSubmitComment} className="flex gap-2">
            <Textarea
              placeholder="Write your comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 min-h-[44px] max-h-[120px] resize-none bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/20"
            />
            <Button 
              type="submit" 
              className="self-end bg-white hover:bg-white/90 text-black"
              disabled={!newComment.trim()}
            >
              Post
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CommentList;

