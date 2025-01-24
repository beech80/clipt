import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface BitrateControlProps {
  bitrate: number;
  minBitrate: number;
  maxBitrate: number;
  onBitrateChange: (value: number[]) => void;
  onBitrateCommit: (value: number[]) => void;
}

export const BitrateControl = ({
  bitrate,
  minBitrate,
  maxBitrate,
  onBitrateChange,
  onBitrateCommit,
}: BitrateControlProps) => {
  return (
    <div className="space-y-2">
      <Label>Bitrate (kbps)</Label>
      <Slider
        value={[bitrate]}
        min={minBitrate}
        max={maxBitrate}
        step={100}
        onValueChange={onBitrateChange}
        onValueCommit={onBitrateCommit}
      />
      <span className="text-sm text-muted-foreground">{bitrate} kbps</span>
    </div>
  );
};