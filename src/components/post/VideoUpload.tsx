import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface VideoUploadProps {
  selectedVideo: File | null;
  onVideoSelect: (file: File | null) => void;
  videoInputRef: React.RefObject<HTMLInputElement>;
}

const VideoUpload = ({ selectedVideo, onVideoSelect, videoInputRef }: VideoUploadProps) => {
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleVideoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 100000000) { // 100MB limit
        toast.error("Video size should be less than 100MB");
        return;
      }
      setUploadProgress(0);
      onVideoSelect(file);
    }
  };

  return (
    <>
      {selectedVideo && (
        <div className="relative space-y-2">
          <video 
            src={URL.createObjectURL(selectedVideo)} 
            controls
            className="w-full rounded-lg max-h-[300px] object-cover"
          />
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                Uploading: {uploadProgress}%
              </p>
            </div>
          )}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => {
              onVideoSelect(null);
              setUploadProgress(0);
            }}
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