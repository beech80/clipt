import { useState, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import PostFormContent from "./post/form/PostFormContent";
import ImageUpload from "./post/ImageUpload";
import VideoUpload from "./post/VideoUpload";
import UploadProgress from "./post/form/UploadProgress";
import MediaPreview from "./post/form/MediaPreview";
import PostFormActions from "./post/form/PostFormActions";
import PostFormMediaEditor from "./post/form/PostFormMediaEditor";
import { uploadImage, uploadVideo } from "@/utils/postUploadUtils";
import { extractMentions, createMention } from "@/utils/mentionUtils";
import { createPost } from "@/services/postService";

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
  const [showEditor, setShowEditor] = useState(false);
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

      const { data: post, error: postError } = await createPost({
        content,
        userId: user.id,
        imageUrl,
        videoUrl
      });

      if (postError) throw postError;
      if (!post) throw new Error("Failed to create post");

      const mentions = extractMentions(content);
      for (const username of mentions) {
        await createMention(username, post.id);
      }

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
        <PostFormContent content={content} onChange={setContent} />
        
        {selectedImage && (
          <>
            <MediaPreview 
              file={selectedImage} 
              type="image" 
              onRemove={() => setSelectedImage(null)} 
            />
            <UploadProgress progress={imageProgress} type="image" />
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEditor(true)}
            >
              Edit Image
            </Button>
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
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditor(true)}
              >
                Edit Video
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditor(true)}
              >
                Convert to GIF
              </Button>
            </div>
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