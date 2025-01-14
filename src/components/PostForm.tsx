import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const PostForm = ({ onPostCreated }: { onPostCreated?: () => void }) => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5000000) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      setSelectedImage(file);
    }
  };

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

      // Upload image if selected
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

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath);

        image_url = publicUrl;
      }

      // Create post
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
        
        {selectedImage && (
          <div className="relative">
            <img 
              src={URL.createObjectURL(selectedImage)} 
              alt="Selected" 
              className="w-full rounded-lg max-h-[300px] object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => setSelectedImage(null)}
            >
              Remove
            </Button>
          </div>
        )}

        <div className="flex justify-between items-center">
          <Button
            type="button"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            className="text-muted-foreground"
          >
            <ImagePlus className="w-4 h-4 mr-2" />
            Add Image
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Posting..." : "Post"}
          </Button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageSelect}
        />
      </form>
    </div>
  );
};

export default PostForm;