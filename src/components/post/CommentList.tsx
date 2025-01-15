import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { MessageSquare, X } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

interface CommentListProps {
  postId: string;
}

const CommentList = ({ postId }: CommentListProps) => {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: comments } = useQuery({
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

  const renderComment = (comment: Comment, level: number = 0) => {
    const replies = comments?.filter(c => c.parent_id === comment.id) || [];
    const isReplyingToThis = replyingTo === comment.id;

    return (
      <div key={comment.id} className={`ml-${level * 4}`}>
        <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
          <img
            src={comment.profiles.avatar_url || "/placeholder.svg"}
            alt={comment.profiles.username}
            className="w-8 h-8 rounded-full"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{comment.profiles.username}</span>
              <span className="text-sm text-muted-foreground">
                {new Date(comment.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <p className="mt-1">{comment.content}</p>
            {user && !isReplyingToThis && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2"
                onClick={() => setReplyingTo(comment.id)}
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Reply
              </Button>
            )}
            {isReplyingToThis && (
              <form onSubmit={(e) => handleSubmitComment(e, comment.id)} className="mt-2">
                <div className="flex items-start gap-2">
                  <Textarea
                    placeholder="Write a reply..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setReplyingTo(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <Button type="submit" size="sm" className="mt-2">
                  Reply
                </Button>
              </form>
            )}
          </div>
        </div>
        {replies.length > 0 && (
          <div className="ml-8 mt-2 space-y-2">
            {replies.map(reply => renderComment(reply, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-4">
      <form onSubmit={(e) => handleSubmitComment(e)} className="mb-4">
        <Textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="mb-2"
        />
        <Button type="submit" disabled={!newComment.trim()}>
          Comment
        </Button>
      </form>

      <div className="space-y-4">
        {comments?.filter(comment => !comment.parent_id).map(comment => renderComment(comment))}
      </div>
    </div>
  );
};

export default CommentList;