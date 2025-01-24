import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface FPSSelectorProps {
  fps: number;
  availableFPS: number[];
  onFPSChange: (value: string) => void;
}

export const FPSSelector = ({ fps, availableFPS, onFPSChange }: FPSSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label>Frame Rate</Label>
      <Select value={String(fps)} onValueChange={onFPSChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select frame rate" />
        </SelectTrigger>
        <SelectContent>
          {availableFPS.map((fpsOption) => (
            <SelectItem key={fpsOption} value={String(fpsOption)}>
              {fpsOption} FPS
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};