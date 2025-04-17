import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { v4 as uuidv4 } from 'uuid';

interface VideoUploadProps {
  selectedVideo: File | null;
  onVideoSelect: (file: File | null) => void;
  videoInputRef: React.RefObject<HTMLInputElement>;
  uploadProgress?: number;
  setUploadProgress?: (progress: number) => void;
  onChange: (url: string) => void;
}

const VideoUpload = ({ 
  selectedVideo, 
  onVideoSelect, 
  videoInputRef,
  uploadProgress = 0,
  setUploadProgress = () => {}, 
  onChange
}: VideoUploadProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [fileUploadError, setFileUploadError] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  // Main function to handle video file upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("File selected:", file);
    setFileUploadError("");

    if (!file) {
      console.error("No file selected");
      setFileUploadError("Please select a video file");
      toast.error("Please select a video file");
      return;
    }

    // More detailed file type validation
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!validVideoTypes.includes(file.type)) {
      console.error("Invalid file type:", file.type);
      setFileUploadError(`Unsupported video format: ${file.type}. Please use MP4, WebM, or MOV formats.`);
      toast.error(`Unsupported video format. Please use MP4, WebM, or MOV formats.`);
      return;
    }

    // Add a maximum file size check (50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      console.error("File too large:", file.size);
      setFileUploadError("Video file is too large (max 50MB)");
      toast.error("Video file is too large (max 50MB)");
      return;
    }

    setIsParsing(true);
    setUploadProgress(0);
    const toastId = toast.loading("Preparing video upload...");

    try {
      // First verify that we have a valid session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log("Session check:", sessionData, sessionError);
      
      if (sessionError || !sessionData?.session) {
        console.error("Session error:", sessionError);
        toast.error("Authentication error. Please sign in again.", { id: toastId });
        setFileUploadError("Authentication error. Please sign in again.");
        setIsParsing(false);
        return;
      }

      // Generate a unique file name
      const fileName = `${uuidv4()}.${file.name.split(".").pop()}`;
      const filePath = `${user?.id}/${fileName}`;
      
      toast.loading(`Processing video...`, { id: toastId });
      
      // Add a small delay to ensure storage is ready (sometimes helps with Supabase timing issues)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Upload the video to Supabase Storage with more robust error handling
      const { data, error } = await supabase.storage
        .from("videos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          onUploadProgress: (progress) => {
            console.log("Upload progress:", progress);
            const percentage = (progress.loaded / progress.total) * 100;
            setUploadProgress(percentage);
            toast.loading(`Uploading: ${Math.round(percentage)}%`, { id: toastId });
          },
        });

      if (error) {
        console.error("Upload error:", error);
        let errorMessage = "";
        
        // Provide more specific error messages based on the error code
        if (error.message.includes("storage quota")) {
          errorMessage = "Storage quota exceeded. Please try a smaller file.";
        } else if (error.message.includes("permission") || error.message.includes("not authorized")) {
          errorMessage = "Permission denied. Please sign in again.";
        } else if (error.message.includes("network")) {
          errorMessage = "Network error. Please check your internet connection.";
        } else {
          errorMessage = error.message || "An error occurred during upload";
        }
        
        console.log('Video public URL obtained:', urlData.publicUrl);
        
        // Validate the URL is accessible
        try {
          const checkResponse = await fetch(urlData.publicUrl, { method: 'HEAD' });
          if (!checkResponse.ok) {
            console.warn(`Video URL validation failed: ${checkResponse.status}`);
          }
        } catch (checkError) {
          console.warn('Error checking video URL, continuing anyway:', checkError);
        }
        
        toast.loading("Creating clip record...", { id: toastId });
        
        // Create a temporary clip record with better error handling
        const { data: clipData, error: clipError } = await supabase
          .from('clips')
          .insert([{
            user_id: user.id,
            video_url: urlData.publicUrl,
          .from("videos")
          .getPublicUrl(filePath);

          if (urlError) {
            console.error("Error getting public URL:", urlError);
            toast.error("Video uploaded but unable to retrieve URL", { id: toastId });
            setFileUploadError("Video uploaded but unable to retrieve URL");
            setIsParsing(false);
            return;
          }

          if (!publicUrlData?.publicUrl) {
            console.error("Missing public URL in response");
            toast.error("Video uploaded but URL is missing", { id: toastId });
            setFileUploadError("Video uploaded but URL is missing");
            setIsParsing(false);
            return;
          }

          console.log("Public URL:", publicUrlData);
          toast.success("Video uploaded successfully!", { id: toastId });
          console.log("Setting video URL to:", publicUrlData.publicUrl);
          onChange(publicUrlData.publicUrl);
          setUploadProgress(100);
        } catch (urlErr) {
          console.error("Error processing public URL:", urlErr);
          toast.error("Video uploaded but failed to process", { id: toastId });
          setFileUploadError("Video uploaded but failed to process");
        }
      }
    } catch (err) {
      console.error("Upload exception:", err);
      toast.error("Upload failed: Server connection error. Please try again.", { id: toastId });
      setFileUploadError("Upload failed: Server connection error. Please try again.");
    } finally {
      setIsParsing(false);
    }
  };
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
                Uploading: {Math.round(uploadProgress)}%
              </p>
            </div>
          )}
          {fileUploadError && (
            <p className="text-sm text-red-500 mt-1">{fileUploadError}</p>
          )}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => {
              onVideoSelect(null);
              setUploadProgress(0);
              setFileUploadError("");
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
        disabled={isParsing}
      >
        <Video className="w-4 h-4 mr-2" />
        {isParsing ? 'Processing...' : 'Add Video'}
      </Button>
      <input
        type="file"
        ref={videoInputRef}
        className="hidden"
        accept="video/mp4,video/webm,video/ogg,video/quicktime"
        onChange={handleVideoUpload}
      />
    </>
  );
};

export default VideoUpload;