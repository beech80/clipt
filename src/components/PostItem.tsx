import { useState, useEffect } from "react";
import PostContent from "./post/PostContent";
import CommentList from "./post/CommentList";
import PostActions from "./post/PostActions";
import PostUserInfo from "./post/PostUserInfo";
import PostStats from "./post/PostStats";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MoreVertical, Pencil, Trash2, FolderPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CollectionSelector from "./post/CollectionSelector";

interface PostItemProps {
  post: {
    id: string;
    content: string;
    image_url: string | null;
    video_url: string | null;
    created_at: string;
    user_id: string;
    profiles: {
      username: string;
      avatar_url: string;
    };
    likes_count: number;
    clip_votes?: { count: number }[];
  };
}

const PostItem = ({ post }: PostItemProps) => {
  const [showComments, setShowComments] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const voteCount = post.clip_votes?.[0]?.count || 0;

  // Track view
  useEffect(() => {
    if (user) {
      const trackView = async () => {
        await supabase
          .from('post_views')
          .insert({
            post_id: post.id,
            viewer_id: user.id
          })
          .onConflict(['post_id', 'viewer_id'])
          .ignore();
      };
      trackView();
    }
  }, [post.id, user]);

  const handleEdit = async () => {
    try {
      // Store edit history
      await supabase
        .from('post_edits')
        .insert({
          post_id: post.id,
          user_id: user?.id,
          previous_content: post.content
        });

      // Update post
      const { error } = await supabase
        .from('posts')
        .update({ content: editedContent })
        .eq('id', post.id);

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
        .eq('id', post.id);

      if (error) throw error;

      toast.success("Post deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    } catch (error) {
      toast.error("Error deleting post");
    }
  };

  return (
    <div className="relative h-full w-full bg-black">
      <PostContent
        content={post.content}
        imageUrl={post.image_url}
        videoUrl={post.video_url}
      />
      
      {user?.id === post.user_id && (
        <div className="absolute top-4 right-4 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsCollectionDialogOpen(true)}>
                <FolderPlus className="w-4 h-4 mr-2" />
                Add to Collection
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-500">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="absolute bottom-32 right-4">
        <PostStats postId={post.id} />
      </div>

      <PostActions
        postId={post.id}
        userId={post.user_id}
        likesCount={post.likes_count}
        voteCount={voteCount}
        onCommentToggle={() => setShowComments(!showComments)}
      />

      <PostUserInfo
        username={post.profiles.username}
        content={post.content}
      />

      {showComments && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/90 h-2/3 rounded-t-xl overflow-hidden">
          <CommentList postId={post.id} />
        </div>
      )}

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

      <Dialog open={isCollectionDialogOpen} onOpenChange={setIsCollectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Collection</DialogTitle>
          </DialogHeader>
          <CollectionSelector 
            postId={post.id} 
            onSuccess={() => {
              setIsCollectionDialogOpen(false);
              toast.success("Added to collection!");
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PostItem;