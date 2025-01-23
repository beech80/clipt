import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { PostFormProvider, usePostForm } from "@/contexts/PostFormContext";
import { usePostFormValidation } from "@/hooks/usePostFormValidation";
import { MediaService } from "@/services/mediaService";
import { extractMentions, createMention } from "@/utils/mentionUtils";
import { createPost } from "@/services/postService";
import { format } from "date-fns";
import PostFormContent from "./PostFormContent";
import PostFormActions from "./PostFormActions";
import PostFormMediaEditor from "./PostFormMediaEditor";
import PostFormMedia from "./PostFormMedia";
import PostFormScheduler from "./PostFormScheduler";
import PostFormMediaPreview from "./PostFormMediaPreview";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface PostFormContainerProps {
  onPostCreated?: () => void;
}

function PostFormInner({ onPostCreated }: PostFormContainerProps) {
  const {
    content,
    selectedImage,
    selectedVideo,
    selectedGif,
    imageProgress,
    videoProgress,
    showEditor,
    scheduledDate,
    scheduledTime,
    error,
    isSubmitting,
    setContent,
    setImageProgress,
    setVideoProgress,
    setShowEditor,
    setSelectedImage,
    setSelectedVideo,
    setScheduledDate,
    setScheduledTime,
    resetForm,
    setIsSubmitting,
    setError,
  } = usePostForm();

  const { validateForm } = usePostFormValidation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

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
        const result = await MediaService.uploadImage(selectedImage, {
          setProgress: setImageProgress
        });
        if (result.error) throw result.error;
        imageUrl = result.url;
      }

      if (selectedVideo) {
        const result = await MediaService.uploadVideo(selectedVideo, {
          setProgress: setVideoProgress
        });
        if (result.error) throw result.error;
        videoUrl = result.url;
      }

      // Validate GIF URL if selected
      if (selectedGif && !(await MediaService.validateMediaUrl(selectedGif))) {
        throw new Error("Invalid GIF URL");
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
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post", { id: toastId });
      setError(error instanceof Error ? error.message : "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditedMedia = (blob: Blob) => {
    const file = new File([blob], 'edited_media', { type: blob.type });
    if (blob.type.startsWith('image/')) {
      setSelectedImage(file);
    } else if (blob.type.startsWith('video/')) {
      setSelectedVideo(file);
    }
    setShowEditor(false);
  };

  if (!user) {
    return (
      <Alert>
        <AlertDescription>
          Please log in to create a post
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="bg-card rounded-lg p-4 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <PostFormContent 
          content={content}
          onChange={setContent}
          disabled={isSubmitting}
        />

        <PostFormMediaPreview />

        <PostFormMedia 
          selectedImage={selectedImage}
          selectedVideo={selectedVideo}
          selectedGif={selectedGif}
          imageProgress={imageProgress}
          videoProgress={videoProgress}
          showGifPicker={false}
          onImageSelect={setSelectedImage}
          onVideoSelect={setSelectedVideo}
          onGifSelect={() => {}}
          onShowGifPickerChange={() => {}}
          onShowEditor={() => setShowEditor(true)}
          disabled={isSubmitting}
        />

        <PostFormScheduler 
          scheduledDate={scheduledDate}
          scheduledTime={scheduledTime}
          onScheduledDateChange={setScheduledDate}
          onScheduledTimeChange={setScheduledTime}
          disabled={isSubmitting}
        />

        <PostFormActions isSubmitting={isSubmitting} />

        {isSubmitting && (
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        )}
      </form>

      <PostFormMediaEditor 
        showEditor={showEditor}
        setShowEditor={setShowEditor}
        onEditedMedia={handleEditedMedia}
        selectedImage={selectedImage}
        selectedVideo={selectedVideo}
      />
    </div>
  );
}

export default function PostFormContainer(props: PostFormContainerProps) {
  return (
    <PostFormProvider>
      <PostFormInner {...props} />
    </PostFormProvider>
  );
}