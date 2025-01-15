import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

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
}

const CommentList = ({ postId }: CommentListProps) => {
  const [newComment, setNewComment] = useState("");
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

  return (
    <div className="mt-4">
      <form onSubmit={handleSubmitComment} className="mb-4">
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
        {comments?.map((comment) => (
          <div key={comment.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
            <img
              src={comment.profiles.avatar_url || "/placeholder.svg"}
              alt={comment.profiles.username}
              className="w-8 h-8 rounded-full"
            />
            <div>
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentList;