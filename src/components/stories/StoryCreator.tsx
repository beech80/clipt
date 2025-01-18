import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, Type, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface StoryCreatorProps {
  onSuccess?: () => void;
}

export const StoryCreator = ({ onSuccess }: StoryCreatorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [textContent, setTextContent] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#000000");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setMediaPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setIsOpen(true);
  };

  const handleSubmit = async () => {
    if (!user || !mediaPreview) return;

    setIsUploading(true);
    try {
      // Upload media to storage
      const mediaFile = fileInputRef.current?.files?.[0];
      if (!mediaFile) throw new Error("No media file selected");

      const mediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image';
      const fileExt = mediaFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('stories')
        .upload(filePath, mediaFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl: mediaUrl } } = supabase.storage
        .from('stories')
        .getPublicUrl(filePath);

      // Create story record
      const { error: insertError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          media_url: mediaUrl,
          media_type: mediaType,
          text_content: textContent,
          background_color: backgroundColor,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

      if (insertError) throw insertError;

      toast.success("Story created successfully!");
      setIsOpen(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error creating story:', error);
      toast.error("Failed to create story");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera className="h-4 w-4" />
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*,video/*"
          onChange={handleFileSelect}
        />
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Story</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {mediaPreview && (
              <div className="aspect-[9/16] relative">
                {fileInputRef.current?.files?.[0]?.type.startsWith('video/') ? (
                  <video
                    src={mediaPreview}
                    className="w-full h-full object-cover rounded-lg"
                    controls
                  />
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                )}
              </div>
            )}

            <div className="space-y-2">
              <Textarea
                placeholder="Add text to your story..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
              />
              <Input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isUploading}>
                {isUploading ? "Creating..." : "Create Story"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};