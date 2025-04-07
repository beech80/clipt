import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const handleVideoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

      try {
        setIsUploading(true);
        setUploadProgress(0);
        onVideoSelect(file);

        // Start the upload process immediately
        const toastId = toast.loading("Uploading video...");
        
        // Upload the video file to storage
        const fileName = `${user.id}-${Date.now()}-${file.name}`;
        const filePath = `uploads/videos/${fileName}`;
        
        // Set up progress monitoring
        const uploadProgress = (progress: number) => {
          setUploadProgress(progress);
        };
        
        // Upload to storage
        const { data, error } = await supabase.storage
          .from('media')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            onUploadProgress: (event) => {
              const progress = Math.round((event.loaded / event.total) * 100);
              uploadProgress(progress);
            }
          });

        if (error) {
          throw error;
        }
        
        // Get the public URL
        const { data: urlData } = await supabase.storage
          .from('media')
          .getPublicUrl(filePath);
        
        if (!urlData?.publicUrl) {
          throw new Error('Failed to get public URL');
        }
        
        // Create a temporary clip record
        const { data: clipData, error: clipError } = await supabase
          .from('clips')
          .insert([{
            user_id: user.id,
            video_url: urlData.publicUrl,
            status: 'draft',
            created_at: new Date().toISOString()
          }])
          .select()
          .single();
        
        if (clipError) {
          throw clipError;
        }

        toast.dismiss(toastId);
        toast.success("Video uploaded! Redirecting to editor...");
        
        // Navigate to the clip editor with the new clip ID
        setTimeout(() => {
          navigate(`/clip-editor/${clipData.id}`);
        }, 1000);
      } catch (error) {
        console.error('Error uploading video:', error);
        toast.error(`Upload failed: ${error.message || 'Unknown error'}`);
        setIsUploading(false);
        setUploadProgress(0);
        onVideoSelect(null);
      }
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
        disabled={isUploading}
      >
        <Video className="w-4 h-4 mr-2" />
        {isUploading ? 'Uploading...' : 'Add Video'}
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