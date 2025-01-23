import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Signal, SignalHigh, SignalMedium, SignalLow, Volume2, Volume1, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { toast } from "sonner";

interface StreamQualityControlsProps {
  streamId: string;
  onQualityChange: (quality: string) => void;
  onVolumeChange: (volume: number) => void;
}

export function StreamQualityControls({ 
  streamId, 
  onQualityChange, 
  onVolumeChange 
}: StreamQualityControlsProps) {
  const [volume, setVolume] = useState(100);
  const [quality, setQuality] = useState("auto");

  const handleQualityChange = (newQuality: string) => {
    setQuality(newQuality);
    onQualityChange(newQuality);
    toast.success(`Stream quality set to ${newQuality}`);
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0];
    setVolume(vol);
    onVolumeChange(vol);
  };

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX className="h-4 w-4" />;
    if (volume < 50) return <Volume1 className="h-4 w-4" />;
    return <Volume2 className="h-4 w-4" />;
  };

  const getQualityIcon = () => {
    switch (quality) {
      case "1080p": return <SignalHigh className="h-4 w-4" />;
      case "720p": return <SignalMedium className="h-4 w-4" />;
      case "480p": return <SignalLow className="h-4 w-4" />;
      default: return <Signal className="h-4 w-4" />;
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          {getQualityIcon()} Stream Quality
        </Label>
        <Select value={quality} onValueChange={handleQualityChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select quality" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto</SelectItem>
            <SelectItem value="1080p">1080p</SelectItem>
            <SelectItem value="720p">720p</SelectItem>
            <SelectItem value="480p">480p</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          {getVolumeIcon()} Volume
        </Label>
        <Slider
          value={[volume]}
          max={100}
          step={1}
          onValueChange={handleVolumeChange}
        />
      </div>
    </Card>
  );
}