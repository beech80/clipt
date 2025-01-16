import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface QualitySettingsFormProps {
  streamId: string;
  currentBitrate?: number;
  currentFps?: number;
  currentResolution?: string;
}

export const QualitySettingsForm = ({ 
  streamId,
  currentBitrate = 2500,
  currentFps = 30,
  currentResolution = "1280x720"
}: QualitySettingsFormProps) => {
  const [bitrate, setBitrate] = useState(currentBitrate);
  const [fps, setFps] = useState(currentFps);
  const [resolution, setResolution] = useState(currentResolution);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('streams')
        .update({
          current_bitrate: bitrate,
          current_fps: fps,
          stream_resolution: resolution
        })
        .eq('id', streamId);

      if (error) throw error;
      toast.success("Stream quality settings updated");
    } catch (error) {
      console.error("Error updating stream quality:", error);
      toast.error("Failed to update stream quality settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bitrate">Bitrate (kbps)</Label>
        <Input
          id="bitrate"
          type="number"
          min="1000"
          max="8000"
          value={bitrate}
          onChange={(e) => setBitrate(Number(e.target.value))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fps">Frame Rate (FPS)</Label>
        <Select value={String(fps)} onValueChange={(value) => setFps(Number(value))}>
          <SelectTrigger>
            <SelectValue placeholder="Select FPS" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">30 FPS</SelectItem>
            <SelectItem value="60">60 FPS</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="resolution">Resolution</Label>
        <Select value={resolution} onValueChange={setResolution}>
          <SelectTrigger>
            <SelectValue placeholder="Select resolution" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1280x720">720p</SelectItem>
            <SelectItem value="1920x1080">1080p</SelectItem>
            <SelectItem value="2560x1440">1440p</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Updating..." : "Update Quality Settings"}
      </Button>
    </form>
  );
};