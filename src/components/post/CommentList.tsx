
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Heart, MoreHorizontal, Loader2 } from "lucide-react";
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
    <div className="fixed inset-0 bg-white z-50 flex flex-col md:flex-row">
      {/* Left side preview (shown only on md screens and up) */}
      <div className="hidden md:block md:w-[65%] bg-black">
        <div className="h-full flex items-center justify-center">
          <div className="text-white/50 text-lg">Post preview</div>
        </div>
      </div>

      {/* Comments section */}
      <div className="flex-1 flex flex-col h-full md:max-w-[35%] bg-white">
        {/* Header */}
        <div className="border-b border-gray-200 px-4 py-3 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-base font-semibold">Comments</h1>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : comments?.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 text-sm">No comments yet</p>
              <p className="text-gray-400 text-sm">Be the first to comment</p>
            </div>
          ) : (
            <div className="py-4 px-4 space-y-4">
              {comments?.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={comment.profiles.avatar_url} />
                    <AvatarFallback>
                      {comment.profiles.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-semibold text-sm">
                          {comment.profiles.username}
                        </span>
                        <span className="ml-2 text-sm">{comment.content}</span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-gray-700"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleReport(comment.id)}
                            className="text-red-600"
                          >
                            Report
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                      {comment.likes_count > 0 && (
                        <span>{comment.likes_count} likes</span>
                      )}
                      <button className="font-semibold hover:text-gray-700">Reply</button>
                      <button className="font-semibold hover:text-gray-700">Like</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comment input */}
        <div className="border-t border-gray-200 px-4 py-3">
          <form onSubmit={handleSubmitComment} className="flex items-center space-x-3">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[44px] max-h-[120px] resize-none border-gray-200 focus-visible:ring-blue-200 rounded-lg py-3"
            />
            <Button 
              type="submit" 
              className="text-blue-500 hover:text-blue-600 font-semibold bg-transparent hover:bg-transparent px-0"
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
