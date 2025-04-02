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
import { useNavigate } from "react-router-dom";

interface PostFormProps {
  onPostCreated?: () => void;
  onClose?: () => void;
}

const PostForm = ({ onPostCreated, onClose }: PostFormProps) => {
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
  const navigate = useNavigate();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading("Creating post...");

    if (!content && !selectedImage && !selectedVideo) {
      toast.error("Please add some content to your post", { id: toastId });
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Safety check for content
      if (content) {
        const isSafe = await checkContentSafety(content);
        if (!isSafe) {
          toast.error("Content contains prohibited words or phrases", { id: toastId });
          setError("Content contains prohibited words or phrases");
          return;
        }
      }

      // Process scheduled time
      let scheduledPublishTime = null;
      if (scheduledDate && scheduledTime) {
        const [hours, minutes] = scheduledTime.split(':').map(Number);
        scheduledPublishTime = new Date(scheduledDate);
        scheduledPublishTime.setHours(hours, minutes);

        // Ensure the scheduled time is in the future
        if (scheduledPublishTime <= new Date()) {
          toast.error("Scheduled time must be in the future", { id: toastId });
          return;
        }
      }

      // Upload image if selected
      let imageUrl = "";
      if (selectedImage) {
        const { url, error } = await uploadImage(selectedImage, setImageProgress);
        if (error) throw error;
        imageUrl = url;
      }

      // Upload video if selected
      let videoUrl = "";
      if (selectedVideo) {
        console.log("Uploading video file:", selectedVideo.name, selectedVideo.type);
        const { url, error } = await uploadVideo(selectedVideo, setVideoProgress);
        if (error) throw error;
        videoUrl = url;
        console.log("Video uploaded successfully to:", url);
      }

      // IMPORTANT: Always set 'clip' type for video posts
      const postType = selectedVideo ? 'clip' : 'regular';
      console.log("Setting post type:", postType, "based on selectedVideo:", !!selectedVideo);

      // Create the post
      const postData = {
        content,
        userId: user.id,
        imageUrl,
        videoUrl,
        scheduledPublishTime: scheduledPublishTime?.toISOString(),
        isPublished: true, // Explicitly set to true to ensure visibility
        postType: postType as 'clip' | 'regular'
      };
      
      console.log("Creating post with data:", postData);

      const { data: post, error: postError } = await createPost(postData);

      if (postError) throw postError;
      if (!post) throw new Error("Failed to create post");
      
      console.log("Post creation complete", post, "Has video:", !!videoUrl, "Post type:", postType);

      // Invalidate the posts queries to refresh the Clipts page
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'clipts'] });

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
      
      // Clear form
      setContent("");
      setSelectedImage(null);
      setSelectedVideo(null);
      setScheduledDate(null);
      setScheduledTime("");

      // For video posts, always navigate to the Clipts page
      if (videoUrl) {
        console.log("Video post created - redirecting to Clipts page");
        
        // Close the form if needed
        if (onClose) onClose();
        
        // Notify parent if needed
        if (onPostCreated) onPostCreated();
        
        // Force redirect to Clipts page with a full page reload to ensure fresh data
        setTimeout(() => {
          window.location.href = '/clipts';
        }, 500);
      } else {
        // For non-video posts, just do the normal close/callback
        if (onPostCreated) onPostCreated();
        if (onClose) onClose();
      }
    } catch (err) {
      console.error("Error creating post:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      toast.error(err instanceof Error ? err.message : "Failed to create post", { id: toastId });
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
    <div className="bg-card rounded-lg p-4 shadow-sm animate-fade-in overflow-hidden" style={{ aspectRatio: '1/1', maxWidth: '100%', minHeight: '360px' }}>
      <form onSubmit={handleSubmit} className="h-full flex flex-col space-y-3">
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

        <div className={`flex ${isMobile ? 'flex-col' : 'flex-wrap'} gap-2 mt-auto`}>
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