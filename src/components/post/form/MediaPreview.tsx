import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MediaPreviewProps {
  file: File;
  type: "image" | "video";
  onRemove: () => void;
}

const MediaPreview = ({ file, type, onRemove }: MediaPreviewProps) => {
  return (
    <div className="relative">
      {type === "image" ? (
        <img 
          src={URL.createObjectURL(file)} 
          alt="Preview" 
          className="w-full rounded-lg max-h-[300px] object-cover"
          onError={() => {
            toast.error("Error loading image preview");
            onRemove();
          }}
        />
      ) : (
        <video 
          src={URL.createObjectURL(file)} 
          controls
          className="w-full rounded-lg max-h-[300px] object-cover"
          onError={() => {
            toast.error("Error loading video preview");
            onRemove();
          }}
        />
      )}
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="absolute top-2 right-2"
        onClick={onRemove}
      >
        Remove
      </Button>
    </div>
  );
};

export default MediaPreview;