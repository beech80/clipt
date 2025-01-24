import { QualityPresetManager } from "../QualityPresetManager";
import { StreamQualityControls } from "../StreamQualityControls";
import { StreamInteractivePanel } from "../StreamInteractivePanel";
import { Card } from "@/components/ui/card";
import type { QualityPreset } from "@/types/streaming";

interface StreamControlsSectionProps {
  userId: string;
  streamId: string;
  isLive: boolean;
  onPresetChange: (preset: QualityPreset) => void;
}

export function StreamControlsSection({
  userId,
  streamId,
  isLive,
  onPresetChange
}: StreamControlsSectionProps) {
  return (
    <>
      <QualityPresetManager 
        streamId={streamId}
        onPresetChange={onPresetChange}
      />

      <StreamQualityControls
        streamId={streamId}
        onQualityChange={(quality) => console.log('Quality changed:', quality)}
        onVolumeChange={(volume) => console.log('Volume changed:', volume)}
      />

      <Card className="p-4">
        <StreamInteractivePanel 
          streamId={streamId}
          isLive={isLive}
        />
      </Card>
    </>
  );
}