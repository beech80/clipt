import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface PostMenuProps {
  postId: string;
  userId: string;
  content: string;
}

const PostMenu = ({ postId, userId, content }: PostMenuProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  if (user?.id !== userId) return null;

  const handleEdit = async () => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ content: editedContent })
        .eq('id', postId);

      if (error) throw error;

      toast.success("Post updated successfully!");
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    } catch (error) {
      toast.error("Error updating post");
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast.success("Post deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    } catch (error) {
      toast.error("Error deleting post");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-red-500">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PostMenu;