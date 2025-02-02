import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MessageSquare, Loader2, Flag, Reply, ChevronDown, ChevronUp } from "lucide-react";
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
  parent_id: string | null;
  profiles: {
    username: string;
    avatar_url: string;
  };
  replies?: Comment[];
}

interface CommentListProps {
  postId: string;
  onBack: () => void;
}

const CommentList = ({ postId, onBack }: CommentListProps) => {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
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

      // Organize comments into threads
      const commentMap = new Map<string, Comment>();
      const topLevelComments: Comment[] = [];

      data.forEach((comment: Comment) => {
        commentMap.set(comment.id, { ...comment, replies: [] });
      });

      data.forEach((comment: Comment) => {
        if (comment.parent_id) {
          const parentComment = commentMap.get(comment.parent_id);
          if (parentComment && parentComment.replies) {
            parentComment.replies.push(commentMap.get(comment.id)!);
          }
        } else {
          topLevelComments.push(commentMap.get(comment.id)!);
        }
      });

      return topLevelComments;
    }
  });

  const handleSubmitComment = async (e: React.FormEvent, parentId: string | null = null) => {
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
          user_id: user.id,
          parent_id: parentId
        });

      if (error) throw error;

      toast.success("Comment added successfully!");
      setNewComment("");
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    } catch (error) {
      toast.error("Error adding comment");
    }
  };

  const handleReport = (commentId: string) => {
    openReportDialog(commentId, 'comment');
  };

  const toggleExpanded = (commentId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  const renderComment = (comment: Comment, depth: number = 0) => (
    <div 
      key={comment.id} 
      className={`p-4 rounded-lg bg-gaming-800/50 hover:bg-gaming-800/70 transition-colors border border-gaming-700/50 animate-glow ${
        depth > 0 ? 'ml-6' : ''
      }`}
    >
      <div className="flex gap-3">
        <Avatar className="w-10 h-10 border-2 border-gaming-600">
          <AvatarImage src={comment.profiles.avatar_url} />
          <AvatarFallback className="bg-gaming-700 text-gaming-100">
            {comment.profiles.username[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gaming-100">{comment.profiles.username}</span>
              <span className="text-sm text-gaming-500">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="text-gaming-400 hover:text-gaming-100"
              >
                <Reply className="h-4 w-4 mr-1" />
                Reply
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Flag className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleReport(comment.id)}>
                    Report Comment
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <p className="mt-1 text-gaming-200">{comment.content}</p>
          
          {replyingTo === comment.id && (
            <div className="mt-4">
              <form onSubmit={(e) => handleSubmitComment(e, comment.id)} className="space-y-2">
                <Textarea
                  placeholder="Write a reply..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px] resize-none bg-gaming-800/50 border-gaming-600 text-gaming-100 placeholder:text-gaming-500"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setReplyingTo(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-gaming-600 hover:bg-gaming-500 text-white"
                    disabled={!newComment.trim()}
                  >
                    Reply
                  </Button>
                </div>
              </form>
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleExpanded(comment.id)}
                className="text-gaming-400 hover:text-gaming-100"
              >
                {expandedComments.has(comment.id) ? (
                  <ChevronUp className="h-4 w-4 mr-1" />
                ) : (
                  <ChevronDown className="h-4 w-4 mr-1" />
                )}
                {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </Button>
              
              {expandedComments.has(comment.id) && (
                <div className="mt-4 space-y-4">
                  {comment.replies.map(reply => renderComment(reply, depth + 1))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gaming-900/95">
      <div className="fixed top-0 left-0 right-0 z-50 bg-gaming-800/90 backdrop-blur supports-[backdrop-filter]:bg-gaming-800/60 border-b border-gaming-700">
        <div className="flex items-center justify-between p-4 max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="hover:bg-gaming-700/50 text-gaming-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gaming-400" />
              <h1 className="text-xl font-bold text-gaming-100">Comments</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto pt-20 pb-32 px-4">
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <Loader2 className="w-8 h-8 animate-spin text-gaming-400" />
          </div>
        ) : comments?.length === 0 ? (
          <div className="text-center py-10">
            <MessageSquare className="w-12 h-12 mx-auto text-gaming-600 mb-3" />
            <p className="text-gaming-400">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments?.map(comment => renderComment(comment))}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gaming-800/90 backdrop-blur supports-[backdrop-filter]:bg-gaming-800/60 border-t border-gaming-700">
        <form onSubmit={(e) => handleSubmitComment(e)} className="max-w-3xl mx-auto p-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 min-h-[80px] resize-none bg-gaming-800/50 border-gaming-600 text-gaming-100 placeholder:text-gaming-500"
            />
            <Button 
              type="submit" 
              className="self-end bg-gaming-600 hover:bg-gaming-500 text-white"
              disabled={!newComment.trim()}
            >
              Post
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentList;