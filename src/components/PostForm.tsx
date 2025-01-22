import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PostFormContent from "./post/form/PostFormContent";
import PostFormActions from "./post/form/PostFormActions";
import PostFormMediaEditor from "./post/form/PostFormMediaEditor";
import PostFormMedia from "./post/form/PostFormMedia";
import PostFormScheduler from "./post/form/PostFormScheduler";
import { uploadImage, uploadVideo } from "@/utils/postUploadUtils";
import { extractMentions, createMention } from "@/utils/mentionUtils";
import { createPost } from "@/services/postService";
import { useIsMobile } from "@/hooks/use-mobile";
import { PostFormProvider, usePostForm } from "@/contexts/PostFormContext";
import { usePostFormValidation } from "@/hooks/usePostFormValidation";
import PostFormMediaPreview from "./post/form/PostFormMediaPreview";

interface PostFormProps {
  onPostCreated?: () => void;
}

function PostFormInner({ onPostCreated }: PostFormProps) {
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
    setImageProgress,
    setVideoProgress,
    setShowEditor,
    setSelectedImage,
    setSelectedVideo,
    setScheduledDate,
    setScheduledTime,
    resetForm,
  } = usePostForm();
  
  const { validateForm } = usePostFormValidation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

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
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post", { id: toastId });
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

  return (
    <div className="bg-card rounded-lg p-4 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <PostFormContent />
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
        />

        <div className={`flex ${isMobile ? 'flex-col' : 'flex-wrap'} gap-2`}>
          <PostFormScheduler 
            scheduledDate={scheduledDate}
            scheduledTime={scheduledTime}
            onScheduledDateChange={setScheduledDate}
            onScheduledTimeChange={setScheduledTime}
          />
        </div>

        <PostFormActions isSubmitting={isSubmitting} />
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

export default function PostForm(props: PostFormProps) {
  return (
    <PostFormProvider>
      <PostFormInner {...props} />
    </PostFormProvider>
  );
}