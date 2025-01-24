import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Video } from "lucide-react";
import type { PresetFormData } from './PresetForm';

interface PresetPreviewProps {
  preset: PresetFormData;
}

export function PresetPreview({ preset }: PresetPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePreview = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          <h3 className="font-medium">Preview</h3>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={togglePreview}
        >
          {isPlaying ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Stop Preview
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Start Preview
            </>
          )}
        </Button>
      </div>

      <div className="space-y-2">
        <div className="bg-muted p-3 rounded-md">
          <h4 className="text-sm font-medium mb-2">Video Settings</h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">FPS:</span> {preset.settings.video.fps}
            </div>
            <div>
              <span className="text-muted-foreground">Bitrate:</span> {preset.settings.video.bitrate}kbps
            </div>
            <div>
              <span className="text-muted-foreground">Resolution:</span> {preset.settings.video.resolution}
            </div>
          </div>
        </div>

        <div className="bg-muted p-3 rounded-md">
          <h4 className="text-sm font-medium mb-2">Audio Settings</h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Bitrate:</span> {preset.settings.audio.bitrate}kbps
            </div>
            <div>
              <span className="text-muted-foreground">Channels:</span> {preset.settings.audio.channels}
            </div>
            <div>
              <span className="text-muted-foreground">Sample Rate:</span> {preset.settings.audio.sampleRate}Hz
            </div>
          </div>
        </div>

        {isPlaying && (
          <div className="relative aspect-video bg-black rounded-md overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center text-white">
              Preview simulation with current settings
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}