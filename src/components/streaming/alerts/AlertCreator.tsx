import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Bell, Volume2, Play } from "lucide-react";
import { toast } from "sonner";

interface AlertStyle {
  duration: number;
  animation: string;
  fontSize: string;
  textColor: string;
  backgroundColor: string;
  soundEnabled: boolean;
  soundVolume: number;
}

export function AlertCreator() {
  const [alertStyle, setAlertStyle] = useState<AlertStyle>({
    duration: 5000,
    animation: 'fade',
    fontSize: '24px',
    textColor: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.8)',
    soundEnabled: true,
    soundVolume: 0.5
  });

  const [messageTemplate, setMessageTemplate] = useState('Thank you for the {action}!');
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  const previewAlert = () => {
    setIsPreviewPlaying(true);
    if (alertStyle.soundEnabled) {
      const audio = new Audio('/sounds/alert.mp3');
      audio.volume = alertStyle.soundVolume;
      audio.play().catch(console.error);
    }
    toast.success('Playing alert preview');
    setTimeout(() => {
      setIsPreviewPlaying(false);
    }, alertStyle.duration);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="h-5 w-5" />
        <h2 className="text-xl font-bold">Alert Creator</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Message Template</label>
          <Input
            value={messageTemplate}
            onChange={(e) => setMessageTemplate(e.target.value)}
            placeholder="Enter message template..."
          />
          <span className="text-sm text-muted-foreground">
            Use {'{action}'} as placeholder
          </span>
        </div>

        <div>
          <label className="text-sm font-medium">Duration (ms)</label>
          <Slider
            value={[alertStyle.duration]}
            onValueChange={(value) => setAlertStyle({
              ...alertStyle,
              duration: value[0]
            })}
            min={1000}
            max={10000}
            step={500}
          />
          <span className="text-sm text-muted-foreground">{alertStyle.duration}ms</span>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Colors</label>
          <div className="flex gap-4">
            <div>
              <span className="text-sm">Text</span>
              <Input
                type="color"
                value={alertStyle.textColor}
                onChange={(e) => setAlertStyle({
                  ...alertStyle,
                  textColor: e.target.value
                })}
              />
            </div>
            <div>
              <span className="text-sm">Background</span>
              <Input
                type="color"
                value={alertStyle.backgroundColor}
                onChange={(e) => setAlertStyle({
                  ...alertStyle,
                  backgroundColor: e.target.value
                })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            <label className="text-sm font-medium">Sound Settings</label>
          </div>
          <Slider
            value={[alertStyle.soundVolume * 100]}
            onValueChange={(value) => setAlertStyle({
              ...alertStyle,
              soundVolume: value[0] / 100
            })}
            disabled={!alertStyle.soundEnabled}
            max={100}
            step={1}
          />
        </div>

        <Button
          onClick={previewAlert}
          disabled={isPreviewPlaying}
          className="w-full"
        >
          <Play className="h-4 w-4 mr-2" />
          Preview Alert
        </Button>

        <div className="relative border rounded-lg h-[100px] bg-black/50 flex items-center justify-center">
          <div
            className={`p-4 rounded ${isPreviewPlaying ? 'animate-fade-in' : ''}`}
            style={{
              backgroundColor: alertStyle.backgroundColor,
              color: alertStyle.textColor,
              fontSize: alertStyle.fontSize
            }}
          >
            {messageTemplate.replace('{action}', 'follow')}
          </div>
        </div>
      </div>
    </Card>
  );
}