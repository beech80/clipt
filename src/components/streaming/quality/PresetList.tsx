import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { PresetData } from './types';

interface PresetListProps {
  presets: PresetData[];
  activePreset: string | null;
  onPresetSelect: (preset: PresetData) => void;
  onEdit: (preset: PresetData) => void;
  onDelete: (presetId: string) => void;
  isApplying: boolean;
}

export function PresetList({ 
  presets, 
  activePreset, 
  onPresetSelect, 
  onEdit, 
  onDelete,
  isApplying 
}: PresetListProps) {
  return (
    <div className="grid gap-4">
      {presets?.map((preset) => (
        <Card key={preset.id} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{preset.name}</h3>
              <p className="text-sm text-muted-foreground">{preset.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(preset)}
              >
                Edit
              </Button>
              <Button
                variant={activePreset === preset.id ? "secondary" : "default"}
                size="sm"
                onClick={() => onPresetSelect(preset)}
                disabled={isApplying}
              >
                {activePreset === preset.id ? 'Active' : 'Apply'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this preset?')) {
                    onDelete(preset.id);
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}