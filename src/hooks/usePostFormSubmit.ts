import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { createPost } from "@/services/postService";
import { uploadImage, uploadVideo } from "@/utils/postUploadUtils";
import { extractMentions, createMention } from "@/utils/mentionUtils";
import { usePostForm } from "@/contexts/PostFormContext";
import { usePostFormValidation } from "@/hooks/usePostFormValidation";

export const usePostFormSubmit = (onPostCreated?: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { validateForm } = usePostFormValidation();
  const {
    content,
    selectedImage,
    selectedVideo,
    selectedGif,
    setImageProgress,
    setVideoProgress,
    scheduledDate,
    scheduledTime,
    resetForm,
  } = usePostForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Creating your post...");

    try {
      let imageUrl = null;
      let videoUrl = null;

      if (selectedImage) {
        const result = await uploadImage(selectedImage, setImageProgress);
        if (result.error) throw result.error;
        imageUrl = result.url;
      }

      if (selectedVideo) {
        const result = await uploadVideo(selectedVideo, setVideoProgress);
        if (result.error) throw result.error;
        videoUrl = result.url;
      }

      const scheduledPublishTime = scheduledDate && scheduledTime
        ? new Date(`${format(scheduledDate, 'yyyy-MM-dd')}T${scheduledTime}`)
        : null;

      const { data: post, error: postError } = await createPost({
        content,
        userId: user!.id,
        imageUrl: imageUrl || selectedGif,
        videoUrl,
        scheduledPublishTime: scheduledPublishTime?.toISOString(),
        isPublished: !scheduledPublishTime
      });

      if (postError) throw postError;
      if (!post) throw new Error("Failed to create post");

      const mentions = extractMentions(content);
      for (const username of mentions) {
        await createMention(username, post.id);
      }

      toast.success(
        scheduledPublishTime 
          ? `Post scheduled for ${format(scheduledPublishTime, 'PPP p')}` 
          : "Post created successfully!", 
        { id: toastId }
      );
      
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      if (onPostCreated) onPostCreated();
      setError(null);
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post", { id: toastId });
      setError(error instanceof Error ? error.message : "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSubmit,
    isSubmitting,
    error,
  };
};