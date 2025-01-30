import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { VideoPreview } from "@/components/clip-editor/VideoPreview";
import { TrimControls } from "@/components/clip-editor/TrimControls";
import { EditorToolbar } from "@/components/clip-editor/EditorToolbar";

export default function ClipEditor() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(10);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleReset = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = startTime;
      setCurrentTime(startTime);
    }
  };

  const handleTrimChange = ([start, end]: [number, number]) => {
    setStartTime(start);
    setEndTime(end);
    if (videoRef.current) {
      videoRef.current.currentTime = start;
      setCurrentTime(start);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#1A1F2C]">
      <div className="flex-1 p-6 space-y-6">
        <div className="gaming-card">
          <h1 className="text-2xl font-bold mb-6 gaming-gradient">Clip Editor</h1>
          <div className="space-y-6">
            <VideoPreview
              videoUrl="/path/to/video.mp4"
              isPlaying={isPlaying}
              currentTime={currentTime}
              onTimeUpdate={handleTimeUpdate}
            />
            
            <div className="gaming-card p-4">
              <TrimControls
                startTime={startTime}
                endTime={endTime}
                duration={10}
                onValueChange={handleTrimChange}
              />
            </div>
            
            <EditorToolbar
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onReset={handleReset}
              onTrim={() => {}}
            />
          </div>
        </div>
      </div>
    </div>
  );
}