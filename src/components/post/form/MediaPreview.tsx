import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MediaPreviewProps {
  file: File;
  type: "image" | "video";
  onRemove: () => void;
}

const MediaPreview = ({ file, type, onRemove }: MediaPreviewProps) => {
  return (
    <div className="relative w-full">
      {type === "image" ? (
        <div className="w-full" style={{ aspectRatio: '1/1' }}>
          <img 
            src={URL.createObjectURL(file)} 
            alt="Preview" 
            className="w-full h-full rounded-lg object-cover"
            onError={() => {
              toast.error("Error loading image preview");
              onRemove();
            }}
          />
        </div>
      ) : (
        <div className="w-full" style={{ aspectRatio: '1/1' }}>
          <video 
            src={URL.createObjectURL(file)} 
            controls
            className="w-full h-full rounded-lg object-cover"
            onError={() => {
              toast.error("Error loading video preview");
              onRemove();
            }}
          />
        </div>
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