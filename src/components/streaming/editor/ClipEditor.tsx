import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Scissors, Play, Pause, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ClipEditorProps {
  videoUrl: string;
  onSave: (clipData: { startTime: number; endTime: number; title: string }) => void;
}

export const ClipEditor = ({ videoUrl, onSave }: ClipEditorProps) => {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(100);
  const [title, setTitle] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const currentTime = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    if (currentTime > endTime) {
      videoRef.current.currentTime = (startTime / 100) * videoRef.current.duration;
    }
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.currentTime = (startTime / 100) * videoRef.current.duration;
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSave = async () => {
    if (!title) {
      toast.error("Please enter a title for your clip");
      return;
    }
    
    onSave({ startTime, endTime, title });
    toast.success("Clip saved successfully!");
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Clip Editor</h3>
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full rounded-lg"
          onTimeUpdate={handleTimeUpdate}
        />
      </div>

      <div className="space-y-4">
        <Input
          placeholder="Enter clip title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Clip Range</p>
          <Slider
            value={[startTime, endTime]}
            min={0}
            max={100}
            step={1}
            onValueChange={([start, end]) => {
              setStartTime(start);
              setEndTime(end);
            }}
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{startTime}%</span>
            <span>{endTime}%</span>
          </div>
        </div>

        <div className="flex gap-4">
          <Button onClick={handlePlayPause} variant="outline">
            {isPlaying ? (
              <><Pause className="h-4 w-4 mr-2" /> Pause</>
            ) : (
              <><Play className="h-4 w-4 mr-2" /> Preview</>
            )}
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Clip
          </Button>
        </div>
      </div>
    </Card>
  );
};