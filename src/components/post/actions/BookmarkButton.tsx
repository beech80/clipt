import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface BookmarkButtonProps {
  postId: string;
}

const BookmarkButton = ({ postId }: BookmarkButtonProps) => {
  const [isSaved, setIsSaved] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      checkBookmarkStatus();
    }
  }, [user, postId]);

  const checkBookmarkStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setIsSaved(!!data);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Please login to bookmark posts!");
      return;
    }

    try {
      if (isSaved) {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsSaved(false);
        toast.success("Post removed from bookmarks!");
      } else {
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (error) throw error;
        setIsSaved(true);
        toast.success("Post bookmarked!");
      }
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    } catch (error) {
      console.error('Error updating bookmark:', error);
      toast.error("Error updating bookmark status");
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSave}
      className={cn("flex items-center gap-2", isSaved && "text-primary")}
    >
      <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
    </Button>
  );
};

export default BookmarkButton;