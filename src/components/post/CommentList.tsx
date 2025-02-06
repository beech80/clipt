
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MessageSquare, Loader2, Flag, X, Heart } from "lucide-react";
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
      <div className="w-full max-w-lg bg-white min-h-screen md:min-h-[80vh] md:rounded-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">Comments</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-700" />
            </Button>
          </div>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-4 space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : comments?.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {comments?.map((comment) => (
                  <div 
                    key={comment.id} 
                    className="group flex items-start gap-3"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.profiles.avatar_url} />
                      <AvatarFallback className="bg-gray-200 text-gray-700">
                        {comment.profiles.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-2">
                            <span className="font-medium text-gray-900">
                              {comment.profiles.username}
                            </span>
                            <p className="text-gray-900">{comment.content}</p>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                            <button className="font-medium hover:text-gray-700">Like</button>
                            <button className="font-medium hover:text-gray-700">Reply</button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 hover:bg-gray-100"
                          >
                            <Heart className="h-4 w-4 text-gray-400" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 hover:bg-gray-100"
                              >
                                <Flag className="h-4 w-4 text-gray-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white">
                              <DropdownMenuItem 
                                onClick={() => handleReport(comment.id)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                Report Comment
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Comment input */}
        <div className="border-t border-gray-200 p-4 sticky bottom-0 bg-white">
          <form onSubmit={handleSubmitComment} className="flex items-center gap-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 min-h-[44px] max-h-[120px] resize-none border-gray-200 focus-visible:ring-blue-200 rounded-full py-2 px-4"
            />
            <Button 
              type="submit" 
              className="text-blue-500 hover:text-blue-600 font-semibold bg-transparent hover:bg-transparent"
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
