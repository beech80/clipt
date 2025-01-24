import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Json } from '@/integrations/supabase/types';

interface PresetListProps {
  presets: Array<{
    id: string;
    name: string;
    description: string;
    settings: Json;
  }>;
  onEdit: (preset: any) => void;
  onDelete: (id: string) => void;
}

export function PresetList({ presets, onEdit, onDelete }: PresetListProps) {
  return (
    <div className="space-y-4">
      {presets.map((preset) => (
        <Card key={preset.id} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{preset.name}</h3>
              {preset.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {preset.description}
                </p>
              )}
            </div>
            <div className="space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEdit(preset)}
              >
                Edit
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => onDelete(preset.id)}
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