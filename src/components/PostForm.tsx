import { useState, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/lib/supabase";

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
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const checkContentSafety = async (text: string): Promise<boolean> => {
    try {
      const { data: matches, error } = await supabase.rpc('check_content_against_filters', {
        content_text: text
      });

      if (error) throw error;

      if (matches && matches.length > 0) {
        const violations = matches.map((m: any) => m.category).join(', ');
        setError(`Content contains inappropriate material (${violations}). Please revise.`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking content:', error);
      return true; // Allow post if check fails
    }
  };

  const validateForm = async () => {
    if (!user) {
      setError("Please login to create a post");
      return false;
    }

    if (!content.trim() && !selectedImage && !selectedVideo) {
      setError("Please add some content, image, or video to your post");
      return false;
    }

    if (selectedImage && selectedVideo) {
      setError("Please choose only one type of media");
      return false;
    }

    // Check content safety
    if (content.trim() && !(await checkContentSafety(content))) {
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!(await validateForm())) {
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
        imageUrl,
        videoUrl,
        scheduledPublishTime: scheduledPublishTime?.toISOString(),
        isPublished: !scheduledPublishTime,
        postType: selectedVideo ? 'clip' : 'regular'
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
    setImageProgress(0);
    setVideoProgress(0);
    setScheduledDate(undefined);
    setScheduledTime("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
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
    <div className="bg-card rounded-lg p-4 shadow-sm animate-fade-in">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
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
              className="w-full sm:w-auto"
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
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEditor(true)}
              className="w-full sm:w-auto"
            >
              Edit Video
            </Button>
          </>
        )}

        <div className={`flex ${isMobile ? 'flex-col' : 'flex-wrap'} gap-2`}>
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

          <Popover>
            <PopoverTrigger asChild>
              <Button 
                type="button" 
                variant="outline"
                className="w-full sm:w-auto animate-fade-in transition-all duration-300 hover:opacity-80"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {scheduledDate ? format(scheduledDate, 'PPP') : 'Schedule'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
              <div className="space-y-4">
                <Calendar
                  mode="single"
                  selected={scheduledDate}
                  onSelect={setScheduledDate}
                  disabled={(date) => date < new Date()}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="px-3 py-2 border rounded-md w-full"
                  />
                  {(scheduledDate || scheduledTime) && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setScheduledDate(undefined);
                        setScheduledTime("");
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
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