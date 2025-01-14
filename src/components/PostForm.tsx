import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import ImageUpload from "./post/ImageUpload";
import { useQueryClient } from "@tanstack/react-query";

const PostForm = ({ onPostCreated }: { onPostCreated?: () => void }) => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to create a post");
      return;
    }

    if (!content.trim() && !selectedImage) {
      toast.error("Please add some content or an image to your post");
      return;
    }

    setIsSubmitting(true);
    try {
      let image_url = null;

      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('posts')
          .upload(filePath, selectedImage);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath);

        image_url = publicUrl;
      }

      const { error } = await supabase
        .from('posts')
        .insert({
          content: content.trim(),
          user_id: user.id,
          image_url
        });

      if (error) throw error;

      toast.success("Post created successfully!");
      setContent("");
      setSelectedImage(null);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      if (onPostCreated) onPostCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error creating post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card rounded-lg p-4 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          placeholder="Share your gaming moments..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[100px] resize-none"
        />
        
        <ImageUpload
          selectedImage={selectedImage}
          onImageSelect={setSelectedImage}
          fileInputRef={fileInputRef}
        />

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