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
    <div className="space-y-6">
      <h2 className="text-xl font-bold gaming-gradient">Effects</h2>
      
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          {effects.map(effect => (
            <Button
              key={effect.id}
              variant="outline"
              onClick={() => onEffectSelect(effect)}
              className="gaming-button h-auto py-3 px-4"
            >
              {effect.name || effect.type}
            </Button>
          ))}
        </div>

        <div className="space-y-4">
          {selectedEffects.map(effect => (
            <Card key={effect.id} className="gaming-card p-4">
              <div className="flex justify-between items-center mb-4">
                <span className="font-medium gaming-gradient">{effect.name || effect.type}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEffectRemove(effect.id)}
                  className="hover:bg-gaming-400/10"
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
                className="gaming-slider"
              />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};