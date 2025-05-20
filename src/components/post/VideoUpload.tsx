import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface VideoUploadProps {
  selectedVideo: File | null;
  onVideoSelect: (file: File | null) => void;
  videoInputRef: React.RefObject<HTMLInputElement>;
  uploadProgress?: number;
  setUploadProgress?: (progress: number) => void;
}

const VideoUpload = ({ 
  selectedVideo, 
  onVideoSelect, 
  videoInputRef,
  uploadProgress = 0,
  setUploadProgress = () => {} 
}: VideoUploadProps) => {
  const handleVideoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 100000000) { // 100MB limit
        toast.error("Video size should be less than 100MB");
        if (event.target) {
          event.target.value = ''; // Reset input
        }
        return;
      }

      // Check file type
      const validTypes = ['video/mp4', 'video/webm', 'video/ogg'];
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload a valid video file (MP4, WebM, or OGG)");
        if (event.target) {
          event.target.value = ''; // Reset input
        }
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
            onError={() => {
              toast.error("Error loading video preview");
              onVideoSelect(null);
              setUploadProgress(0);
            }}
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
              if (videoInputRef.current) {
                videoInputRef.current.value = '';
              }
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
        accept="video/mp4,video/webm,video/ogg"
        onChange={handleVideoSelect}
      />
    </>
  );
};

export default VideoUpload;