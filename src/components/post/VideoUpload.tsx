import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { toast } from "sonner";

interface VideoUploadProps {
  selectedVideo: File | null;
  onVideoSelect: (file: File | null) => void;
  videoInputRef: React.RefObject<HTMLInputElement>;
}

const VideoUpload = ({ selectedVideo, onVideoSelect, videoInputRef }: VideoUploadProps) => {
  const handleVideoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 100000000) { // 100MB limit
        toast.error("Video size should be less than 100MB");
        return;
      }
      onVideoSelect(file);
    }
  };

  return (
    <>
      {selectedVideo && (
        <div className="relative">
          <video 
            src={URL.createObjectURL(selectedVideo)} 
            controls
            className="w-full rounded-lg max-h-[300px] object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => onVideoSelect(null)}
          >
            Remove
          </Button>
        </div>
      )}
      <Button
        type="button"
        variant="ghost"
        onClick={() => videoInputRef.current?.click()}
        className="text-muted-foreground"
      >
        <Video className="w-4 h-4 mr-2" />
        Add Video
      </Button>
      <input
        type="file"
        ref={videoInputRef}
        className="hidden"
        accept="video/*"
        onChange={handleVideoSelect}
      />
    </>
  );
};

export default VideoUpload;