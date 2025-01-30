import { Effect, EffectsPanelProps } from "@/types/clip-editor";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { X } from "lucide-react";

export const EffectsPanel = ({
  effects,
  selectedEffects,
  onEffectSelect,
  onEffectRemove,
  onEffectSettingsChange
}: EffectsPanelProps) => {
  return (
    <div className="w-80 border-l border-border bg-card p-4 space-y-4">
      <h2 className="text-lg font-semibold">Effects</h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {effects.map(effect => (
            <Button
              key={effect.id}
              variant="outline"
              onClick={() => onEffectSelect(effect)}
              className="h-auto py-2"
            >
              {effect.name || effect.type}
            </Button>
          ))}
        </div>

        <div className="space-y-4">
          {selectedEffects.map(effect => (
            <Card key={effect.id} className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{effect.name || effect.type}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEffectRemove(effect.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Slider
                value={[effect.settings.value]}
                min={0}
                max={100}
                step={1}
                onValueChange={([value]) => 
                  onEffectSettingsChange(effect.id, { value })
                }
              />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};