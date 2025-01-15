import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import ImageUpload from "./post/ImageUpload";
import VideoUpload from "./post/VideoUpload";
import { useQueryClient } from "@tanstack/react-query";

const PostForm = ({ onPostCreated }: { onPostCreated?: () => void }) => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to create a post");
      return;
    }

    if (!content.trim() && !selectedImage && !selectedVideo) {
      toast.error("Please add some content, image, or video to your post");
      return;
    }

    if (selectedImage && selectedVideo) {
      toast.error("Please choose either an image or a video, not both");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Creating your post...");

    try {
      let image_url = null;
      let video_url = null;

      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('posts')
          .upload(filePath, selectedImage);

        if (uploadError) {
          toast.error("Failed to upload image", { id: toastId });
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath);

        image_url = publicUrl;
      }

      if (selectedVideo) {
        const fileExt = selectedVideo.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Simulate upload progress
        const uploadInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(uploadInterval);
              return prev;
            }
            return prev + 10;
          });
        }, 500);

        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(filePath, selectedVideo);

        clearInterval(uploadInterval);

        if (uploadError) {
          setUploadProgress(0);
          toast.error("Failed to upload video", { id: toastId });
          throw uploadError;
        }

        setUploadProgress(100);

        const { data: { publicUrl } } = supabase.storage
          .from('videos')
          .getPublicUrl(filePath);

        video_url = publicUrl;
      }

      const { error } = await supabase
        .from('posts')
        .insert({
          content: content.trim(),
          user_id: user.id,
          image_url,
          video_url
        });

      if (error) {
        toast.error("Failed to create post", { id: toastId });
        throw error;
      }

      toast.success("Post created successfully!", { id: toastId });
      setContent("");
      setSelectedImage(null);
      setSelectedVideo(null);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      if (onPostCreated) onPostCreated();
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error(error instanceof Error ? error.message : "Error creating post", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card rounded-lg p-4 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          placeholder="Share your gaming moments..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[100px] resize-none"
        />
        
        {!selectedVideo && (
          <ImageUpload
            selectedImage={selectedImage}
            onImageSelect={setSelectedImage}
            fileInputRef={fileInputRef}
          />
        )}

        {!selectedImage && (
          <VideoUpload
            selectedVideo={selectedVideo}
            onVideoSelect={setSelectedVideo}
            videoInputRef={videoInputRef}
            uploadProgress={uploadProgress}
            setUploadProgress={setUploadProgress}
          />
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Posting..." : "Post"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PostForm;