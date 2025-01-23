import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { getDVRSegments, getDVRPlaybackUrl } from "@/utils/dvrUtils";
import { Rewind, FastForward, Play, Pause } from "lucide-react";

interface DVRControlsProps {
  streamId: string;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export const DVRControls = ({ streamId, videoRef }: DVRControlsProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [segments, setSegments] = useState<any[]>([]);

  useEffect(() => {
    const loadSegments = async () => {
      const streamSegments = await getDVRSegments(streamId);
      setSegments(streamSegments || []);
      
      if (streamSegments?.length) {
        const totalDuration = streamSegments.reduce(
          (acc, segment) => acc + parseFloat(segment.segment_duration), 
          0
        );
        setDuration(totalDuration);
      }
    };

    loadSegments();
  }, [streamId]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = async (time: number) => {
    if (!videoRef.current) return;
    
    const url = await getDVRPlaybackUrl(streamId, time);
    if (url) {
      videoRef.current.src = url;
      videoRef.current.currentTime = time;
      if (isPlaying) {
        videoRef.current.play();
      }
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="space-y-4 p-4 bg-background/95 rounded-lg shadow-lg">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleSeek(currentTime - 10)}
        >
          <Rewind className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlayPause}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleSeek(currentTime + 10)}
        >
          <FastForward className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Slider
          value={[currentTime]}
          max={duration}
          step={1}
          onValueChange={([value]) => handleSeek(value)}
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{new Date(currentTime * 1000).toISOString().substr(11, 8)}</span>
          <span>{new Date(duration * 1000).toISOString().substr(11, 8)}</span>
        </div>
      </div>
    </div>
  );
};