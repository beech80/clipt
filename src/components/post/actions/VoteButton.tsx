import { Button } from "@/components/ui/button";
import { ThumbsUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface VoteButtonProps {
  postId: string;
  voteCount: number;
}

const VoteButton = ({ postId, voteCount }: VoteButtonProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleVote = async () => {
    if (!user) {
      toast.error("Please login to vote!");
      return;
    }

    try {
      const { error } = await supabase
        .from('clip_votes')
        .insert({
          post_id: postId,
          user_id: user.id
        });

      if (error) {
        if (error.code === '23505') {
          toast.error("You've already voted for this clip!");
        } else {
          throw error;
        }
      } else {
        toast.success("Vote recorded!");
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      }
    } catch (error) {
      toast.error("Error recording vote");
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleVote}
      className="flex items-center gap-2"
    >
      <ThumbsUp className="w-4 h-4" />
      <span className="text-sm">{voteCount}</span>
    </Button>
  );
};

export default VoteButton;