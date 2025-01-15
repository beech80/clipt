import { useState, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import PostFormContent from "./post/form/PostFormContent";
import MediaUploadSection from "./post/form/MediaUploadSection";
import FormActions from "./post/form/FormActions";
import { useContentParser } from "./post/form/ContentParser";

interface PostFormProps {
  onPostCreated?: () => void;
  editingPost?: {
    id: string;
    content: string;
  };
}

const PostForm = ({ onPostCreated, editingPost }: PostFormProps) => {
  const [content, setContent] = useState(editingPost?.content || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [imageProgress, setImageProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { hashtags, mentions } = useContentParser(content);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() && !selectedImage && !selectedVideo) {
      toast.error("Please add some content, image, or video to your post");
      return;
    }

    if (selectedImage && selectedVideo) {
      toast.error("Please choose either an image or a video, not both");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(editingPost ? "Updating your post..." : "Creating your post...");

    try {
      let image_url = null;
      let video_url = null;

      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const imageInterval = setInterval(() => {
          setImageProgress(prev => Math.min(prev + 20, 90));
        }, 500);

        const { error: uploadError, data } = await supabase.storage
          .from('posts')
          .upload(filePath, selectedImage);

        clearInterval(imageInterval);
        setImageProgress(100);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath);

        image_url = publicUrl;
      }

      if (selectedVideo) {
        const fileExt = selectedVideo.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const videoInterval = setInterval(() => {
          setVideoProgress(prev => Math.min(prev + 10, 90));
        }, 500);

        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(filePath, selectedVideo);

        clearInterval(videoInterval);
        setVideoProgress(100);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('videos')
          .getPublicUrl(filePath);

        video_url = publicUrl;
      }

      if (editingPost) {
        // Store previous content in post_edits if user is authenticated
        if (user) {
          await supabase
            .from('post_edits')
            .insert({
              post_id: editingPost.id,
              user_id: user.id,
              previous_content: editingPost.content
            })
            .select();
        }

        // Update the post
        const { error } = await supabase
          .from('posts')
          .update({
            content: content.trim(),
            image_url: image_url || null,
            video_url: video_url || null
          })
          .eq('id', editingPost.id)
          .select();

        if (error) throw error;
      } else {
        // Create new post
        const { data: post, error } = await supabase
          .from('posts')
          .insert({
            content: content.trim(),
            user_id: user?.id || null,
            image_url,
            video_url
          })
          .select('id')
          .single();

        if (error) throw error;

        // Insert hashtags if user is authenticated
        if (user && hashtags.length > 0) {
          // First, ensure all hashtags exist
          for (const tag of hashtags) {
            await supabase
              .from('hashtags')
              .insert({ name: tag })
              .select()
              .maybeSingle();
          }

          // Get hashtag IDs
          const { data: hashtagData } = await supabase
            .from('hashtags')
            .select('id, name')
            .in('name', hashtags);

          if (hashtagData) {
            // Link hashtags to post
            await supabase
              .from('post_hashtags')
              .insert(
                hashtagData.map(tag => ({
                  post_id: post.id,
                  hashtag_id: tag.id
                }))
              )
              .select();
          }
        }
      }

      toast.success(editingPost ? "Post updated successfully!" : "Post created successfully!", { id: toastId });
      setContent("");
      setSelectedImage(null);
      setSelectedVideo(null);
      setImageProgress(0);
      setVideoProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
      
      // Invalidate and refetch posts query to update the home page
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      
      if (onPostCreated) onPostCreated();
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error(editingPost ? "Failed to update post" : "Failed to create post", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card rounded-lg p-4 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <PostFormContent 
          content={content} 
          onChange={setContent}
          hashtags={hashtags}
          mentions={mentions}
        />
        
        <MediaUploadSection
          selectedImage={selectedImage}
          selectedVideo={selectedVideo}
          imageProgress={imageProgress}
          videoProgress={videoProgress}
          onImageSelect={setSelectedImage}
          onVideoSelect={setSelectedVideo}
          fileInputRef={fileInputRef}
          videoInputRef={videoInputRef}
        />

        <FormActions isSubmitting={isSubmitting} isEditing={!!editingPost} />
      </form>
    </div>
  );
};

export default PostForm;