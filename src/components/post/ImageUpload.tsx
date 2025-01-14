import { Button } from "@/components/ui/button";
import { ImagePlus } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  selectedImage: File | null;
  onImageSelect: (file: File | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const ImageUpload = ({ selectedImage, onImageSelect, fileInputRef }: ImageUploadProps) => {
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5000000) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      onImageSelect(file);
    }
  };

  return (
    <>
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
            onClick={() => onImageSelect(null)}
          >
            Remove
          </Button>
        </div>
      )}
      <Button
        type="button"
        variant="ghost"
        onClick={() => fileInputRef.current?.click()}
        className="text-muted-foreground"
      >
        <ImagePlus className="w-4 h-4 mr-2" />
        Add Image
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageSelect}
      />
    </>
  );
};

export default ImageUpload;