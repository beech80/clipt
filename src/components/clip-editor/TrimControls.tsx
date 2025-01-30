import { Slider } from "@/components/ui/slider";

interface TrimControlsProps {
  startTime: number;
  endTime: number;
  duration: number;
  onValueChange: (values: [number, number]) => void;
}

export const TrimControls = ({ startTime, endTime, duration, onValueChange }: TrimControlsProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Trim Video</label>
      <Slider
        value={[startTime, endTime]}
        min={0}
        max={duration}
        step={0.1}
        onValueChange={onValueChange}
      />
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{startTime.toFixed(1)}s</span>
        <span>{endTime.toFixed(1)}s</span>
      </div>
    </div>
  );
};