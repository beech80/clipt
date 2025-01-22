import { useState } from "react";
import { toast } from "sonner";
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

interface PostFormProps {
  onPostCreated?: () => void;
}

const PostForm = ({ onPostCreated }: PostFormProps) => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [imageProgress, setImageProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const validateForm = () => {
    if (!user) {
      setError("Please login to create a post");
      return false;
    }

    if (!content.trim() && !selectedImage && !selectedVideo && !selectedGif) {
      setError("Please add some content, image, GIF, or video to your post");
      return false;
    }

    if ((selectedImage && selectedVideo) || (selectedImage && selectedGif) || (selectedVideo && selectedGif)) {
      setError("Please choose only one type of media");
      return false;
    }

    setError(null);
    return true;
  };

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
        userId: user.id,
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
      setError("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setContent("");
    setSelectedImage(null);
    setSelectedVideo(null);
    setSelectedGif(null);
    setImageProgress(0);
    setVideoProgress(0);
    setScheduledDate(undefined);
    setScheduledTime("");
    setError(null);
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
        
        <PostFormContent content={content} onChange={setContent} />
        
        <PostFormMedia
          selectedImage={selectedImage}
          selectedVideo={selectedVideo}
          selectedGif={selectedGif}
          imageProgress={imageProgress}
          videoProgress={videoProgress}
          showGifPicker={showGifPicker}
          onImageSelect={setSelectedImage}
          onVideoSelect={setSelectedVideo}
          onGifSelect={setSelectedGif}
          onShowGifPickerChange={setShowGifPicker}
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
        selectedImage={selectedImage}
        selectedVideo={selectedVideo}
        onEditedMedia={handleEditedMedia}
      />
    </div>
  );
};

export default PostForm;