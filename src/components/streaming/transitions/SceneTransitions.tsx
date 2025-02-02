import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RotateCcw, ArrowLeftRight, ArrowUpDown, Play } from "lucide-react";
import { toast } from "sonner";

interface TransitionEffect {
  name: string;
  duration: number;
  type: 'fade' | 'slide' | 'rotate' | 'zoom';
  direction?: 'left' | 'right' | 'up' | 'down';
}

export function SceneTransitions() {
  const [selectedEffect, setSelectedEffect] = useState<TransitionEffect>({
    name: 'Fade',
    duration: 500,
    type: 'fade'
  });

  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  const effects: TransitionEffect[] = [
    { name: 'Fade', duration: 500, type: 'fade' },
    { name: 'Slide Left', duration: 500, type: 'slide', direction: 'left' },
    { name: 'Slide Right', duration: 500, type: 'slide', direction: 'right' },
    { name: 'Rotate', duration: 500, type: 'rotate' },
    { name: 'Zoom', duration: 500, type: 'zoom' }
  ];

  const previewTransition = () => {
    setIsPreviewPlaying(true);
    toast.success('Playing transition preview');
    setTimeout(() => {
      setIsPreviewPlaying(false);
    }, selectedEffect.duration);
  };

  return (
    <Card className="p-4">
      <h2 className="text-xl font-bold mb-4">Scene Transitions</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        {effects.map((effect) => (
          <Button
            key={effect.name}
            variant={selectedEffect.name === effect.name ? "default" : "outline"}
            onClick={() => setSelectedEffect(effect)}
            className="flex items-center gap-2"
          >
            {effect.type === 'slide' && <ArrowLeftRight className="h-4 w-4" />}
            {effect.type === 'rotate' && <RotateCcw className="h-4 w-4" />}
            {effect.name}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Duration (ms)</label>
          <Slider
            value={[selectedEffect.duration]}
            onValueChange={(value) => setSelectedEffect({
              ...selectedEffect,
              duration: value[0]
            })}
            min={100}
            max={2000}
            step={100}
          />
          <span className="text-sm text-muted-foreground">{selectedEffect.duration}ms</span>
        </div>

        <div className="flex justify-between items-center">
          <Button
            onClick={previewTransition}
            disabled={isPreviewPlaying}
          >
            <Play className="h-4 w-4 mr-2" />
            Preview Transition
          </Button>
        </div>

        <div className="relative border rounded-lg h-[200px] bg-black/50">
          <div className={`
            absolute inset-0 bg-primary/20 rounded-lg
            ${isPreviewPlaying ? `animate-${selectedEffect.type}-${selectedEffect.direction || ''}` : ''}
          `} />
        </div>
      </div>
    </Card>
  );
}