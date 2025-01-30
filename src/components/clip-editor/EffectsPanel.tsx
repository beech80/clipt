import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Effect } from "@/types/clip-editor";

interface EffectsPanelProps {
  effects?: Effect[];
  appliedEffects: Effect[];
  onEffectChange: (effectId: string, value: number) => void;
}

export const EffectsPanel = ({ effects, appliedEffects, onEffectChange }: EffectsPanelProps) => {
  return (
    <Card>
      <ScrollArea className="h-[600px]">
        <div className="p-4 space-y-6">
          <h3 className="font-semibold mb-4">Effects</h3>
          {effects?.map((effect) => (
            <div key={effect.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{effect.name}</span>
                {effect.is_premium && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    Premium
                  </span>
                )}
              </div>
              <Slider
                value={[appliedEffects.find(e => e.id === effect.id)?.settings?.value ?? 0]}
                min={0}
                max={100}
                step={1}
                onValueChange={([value]) => onEffectChange(effect.id, value)}
              />
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};