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
import ImageUpload from "../post/ImageUpload";
import VideoUpload from "../post/VideoUpload";

interface PostMenuProps {
  postId: string;
  userId: string;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
}

const PostMenu = ({ postId, userId, content, imageUrl, videoUrl }: PostMenuProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  if (user?.id !== userId) return null;

  const handleEdit = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    const toastId = toast.loading("Updating post...");

    try {
      let new_image_url = imageUrl;
      let new_video_url = videoUrl;

      // Handle image upload if a new image is selected
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('posts')
          .upload(filePath, selectedImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath);

        new_image_url = publicUrl;
      }

      // Handle video upload if a new video is selected
      if (selectedVideo) {
        const fileExt = selectedVideo.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(filePath, selectedVideo);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('videos')
          .getPublicUrl(filePath);

        new_video_url = publicUrl;
      }

      // Save edit history
      await supabase
        .from('post_edits')
        .insert({
          post_id: postId,
          user_id: user.id,
          previous_content: content
        });

      // Update post
      const { error } = await supabase
        .from('posts')
        .update({ 
          content: editedContent,
          image_url: new_image_url,
          video_url: new_video_url
        })
        .eq('id', postId);

      if (error) throw error;

      toast.success("Post updated successfully!", { id: toastId });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("Error updating post", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this post?");
    if (!confirmDelete) return;

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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[100px]"
              placeholder="What's on your mind?"
            />
            
            {!selectedVideo && !videoUrl && (
              <ImageUpload
                selectedImage={selectedImage}
                onImageSelect={setSelectedImage}
                fileInputRef={{ current: null }}
              />
            )}

            {!selectedImage && !imageUrl && (
              <VideoUpload
                selectedVideo={selectedVideo}
                onVideoSelect={setSelectedVideo}
                videoInputRef={{ current: null }}
                uploadProgress={0}
                setUploadProgress={() => {}}
              />
            )}

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEdit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PostMenu;