import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Scissors, Play, Pause, RotateCcw } from "lucide-react";

interface VideoEditorProps {
  videoFile: File;
  onSave: (trimmedVideo: Blob) => void;
}

const VideoEditor = ({ videoFile, onSave }: VideoEditorProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setEndTime(videoRef.current.duration);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTrim = async () => {
    if (!videoRef.current) return;

    try {
      const stream = (videoRef.current as any).captureStream();
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm'
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        onSave(blob);
        toast.success("Video trimmed successfully!");
      };

      videoRef.current.currentTime = startTime;
      mediaRecorder.start();

      setTimeout(() => {
        mediaRecorder.stop();
      }, (endTime - startTime) * 1000);

    } catch (error) {
      toast.error("Error trimming video");
      console.error("Error trimming video:", error);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg">
      <video
        ref={videoRef}
        src={URL.createObjectURL(videoFile)}
        className="w-full rounded-lg"
        onLoadedMetadata={handleLoadedMetadata}
      />

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Trim Video</label>
          <Slider
            value={[startTime, endTime]}
            min={0}
            max={duration}
            step={0.1}
            onValueChange={([start, end]) => {
              setStartTime(start);
              setEndTime(end);
            }}
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{startTime.toFixed(1)}s</span>
            <span>{endTime.toFixed(1)}s</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePlayPause}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.currentTime = 0;
              }
            }}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button 
            variant="default"
            onClick={handleTrim}
            className="ml-auto"
          >
            <Scissors className="h-4 w-4 mr-2" />
            Trim Video
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;