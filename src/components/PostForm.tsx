import { useState, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Grid } from "@giphy/react-components";
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

const gf = new GiphyFetch('pLURtkhVrUXr3KG25Gy5IvzziV5OrZGa'); // Giphy API key

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

    if (!content.trim() && !selectedImage && !selectedVideo && !selectedGif) {
      toast.error("Please add some content, image, GIF, or video to your post");
      return;
    }

    if ((selectedImage && selectedVideo) || (selectedImage && selectedGif) || (selectedVideo && selectedGif)) {
      toast.error("Please choose only one type of media");
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
      
      setContent("");
      setSelectedImage(null);
      setSelectedVideo(null);
      setSelectedGif(null);
      setImageProgress(0);
      setVideoProgress(0);
      setScheduledDate(undefined);
      setScheduledTime("");
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

        {selectedGif && (
          <div className="relative">
            <img src={selectedGif} alt="Selected GIF" className="rounded-lg max-h-96 w-auto" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => setSelectedGif(null)}
            >
              Remove
            </Button>
          </div>
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
            </div>
          </>
        )}

        <div className="flex flex-wrap gap-2">
          {!selectedVideo && !selectedGif && (
            <ImageUpload
              selectedImage={selectedImage}
              onImageSelect={setSelectedImage}
              fileInputRef={fileInputRef}
            />
          )}

          {!selectedImage && !selectedGif && (
            <VideoUpload
              selectedVideo={selectedVideo}
              onVideoSelect={setSelectedVideo}
              videoInputRef={videoInputRef}
              uploadProgress={videoProgress}
              setUploadProgress={setVideoProgress}
            />
          )}

          {!selectedImage && !selectedVideo && (
            <Popover open={showGifPicker} onOpenChange={setShowGifPicker}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline">
                  Add GIF
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0" align="start">
                <div className="h-[300px] overflow-auto">
                  <Grid
                    width={300}
                    columns={2}
                    fetchGifs={(offset: number) => gf.trending({ offset, limit: 10 })}
                    onGifClick={(gif) => {
                      setSelectedGif(gif.images.fixed_height.url);
                      setShowGifPicker(false);
                    }}
                  />
                </div>
              </PopoverContent>
            </Popover>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline">
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
                    className="px-3 py-2 border rounded-md"
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