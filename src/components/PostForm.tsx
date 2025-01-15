import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import PostFormContent from "./post/form/PostFormContent";
import ImageUpload from "./post/ImageUpload";
import VideoUpload from "./post/VideoUpload";
import UploadProgress from "./post/form/UploadProgress";
import MediaPreview from "./post/form/MediaPreview";

interface PostFormProps {
  onPostCreated?: () => void;
}

const PostForm = ({ onPostCreated }: PostFormProps) => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [imageProgress, setImageProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
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

        // Simulate upload progress for image
        const imageInterval = setInterval(() => {
          setImageProgress(prev => Math.min(prev + 20, 90));
        }, 500);

        const { error: uploadError, data } = await supabase.storage
          .from('posts')
          .upload(filePath, selectedImage);

        clearInterval(imageInterval);
        setImageProgress(100);

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

        // Simulate upload progress for video
        const videoInterval = setInterval(() => {
          setVideoProgress(prev => Math.min(prev + 10, 90));
        }, 500);

        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(filePath, selectedVideo);

        clearInterval(videoInterval);
        setVideoProgress(100);

        if (uploadError) {
          toast.error("Failed to upload video", { id: toastId });
          throw uploadError;
        }

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

      if (error) throw error;

      toast.success("Post created successfully!", { id: toastId });
      setContent("");
      setSelectedImage(null);
      setSelectedVideo(null);
      setImageProgress(0);
      setVideoProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      if (onPostCreated) onPostCreated();
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card rounded-lg p-4 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <PostFormContent content={content} onChange={setContent} />
        
        {selectedImage && (
          <>
            <MediaPreview 
              file={selectedImage} 
              type="image" 
              onRemove={() => setSelectedImage(null)} 
            />
            <UploadProgress progress={imageProgress} type="image" />
          </>
        )}

        {selectedVideo && (
          <>
            <MediaPreview 
              file={selectedVideo} 
              type="video" 
              onRemove={() => setSelectedVideo(null)} 
            />
            <UploadProgress progress={videoProgress} type="video" />
          </>
        )}

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
            uploadProgress={videoProgress}
            setUploadProgress={setVideoProgress}
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