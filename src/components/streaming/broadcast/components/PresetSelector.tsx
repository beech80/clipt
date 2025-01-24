import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { EncoderPreset } from "@/types/broadcast";

interface PresetSelectorProps {
  presets: Record<string, EncoderPreset>;
  currentPreset: string;
  onPresetChange: (preset: string) => void;
}

export const PresetSelector = ({ presets, currentPreset, onPresetChange }: PresetSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label>Quality Preset</Label>
      <Select value={currentPreset} onValueChange={onPresetChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select quality preset" />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(presets).map((preset) => (
            <SelectItem key={preset} value={preset}>
              {preset.charAt(0).toUpperCase() + preset.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};