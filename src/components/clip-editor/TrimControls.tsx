import { Slider } from "@/components/ui/slider";
import type { TrimControlsProps } from "@/types/clip-editor";

export const TrimControls = ({ startTime, endTime, duration, onValueChange }: TrimControlsProps) => {
  return (
    <div className="space-y-4">
      <label className="text-sm font-medium gaming-gradient">Trim Video</label>
      <Slider
        value={[startTime, endTime]}
        min={0}
        max={duration}
        step={0.1}
        onValueChange={onValueChange}
        className="gaming-slider"
      />
      <div className="flex justify-between text-sm text-gaming-400">
        <span>{startTime.toFixed(1)}s</span>
        <span>{endTime.toFixed(1)}s</span>
      </div>
    </div>
  );
};