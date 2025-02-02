import React, { useState, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Image, Camera } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ThumbnailCreatorProps {
  videoUrl: string;
  onThumbnailCreated: (thumbnailUrl: string) => void;
}

export const ThumbnailCreator = ({ videoUrl, onThumbnailCreated }: ThumbnailCreatorProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current frame
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/jpeg', 0.95);
      });

      // Upload to Supabase Storage
      const fileName = `thumbnail-${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('thumbnails')
        .upload(fileName, blob);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(fileName);

      onThumbnailCreated(publicUrl);
      toast.success("Thumbnail captured successfully!");
    } catch (error) {
      console.error('Error capturing thumbnail:', error);
      toast.error("Failed to capture thumbnail");
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Camera className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Thumbnail Creator</h3>
      </div>

      <div className="space-y-4">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full rounded-lg"
          controls
        />
        
        <canvas
          ref={canvasRef}
          className="hidden"
        />

        <Button 
          onClick={captureFrame} 
          disabled={isCapturing}
          className="w-full"
        >
          <Image className="h-4 w-4 mr-2" />
          {isCapturing ? "Capturing..." : "Capture Thumbnail"}
        </Button>
      </div>
    </Card>
  );
};