import { Card } from '@/components/ui/card';
import type { PresetFormData } from './types';

interface PresetPreviewProps {
  preset: PresetFormData;
}

export function PresetPreview({ preset }: PresetPreviewProps) {
  return (
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
    </div>
  );
}