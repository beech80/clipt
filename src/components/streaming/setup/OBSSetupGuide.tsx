import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Video, Camera, Mic, Info, Check } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const OBSSetupGuide = () => {
  const { data: streamSettings } = useQuery({
    queryKey: ['stream-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('streaming_config')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const copyToClipboard = (text: string | null, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text)
      .then(() => toast.success(`${label} copied to clipboard`))
      .catch(() => toast.error(`Failed to copy ${label}`));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">OBS Setup Guide</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Basic Settings</h3>
          </div>
          <div className="space-y-2">
            <p>1. Open OBS Studio</p>
            <p>2. Go to Settings → Stream</p>
            <p>3. Select "Custom" as Service</p>
            {streamSettings && (
              <>
                <div className="flex items-center gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => copyToClipboard(streamSettings.ingest_endpoint, 'Server URL')}
                  >
                    Copy Server URL
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Video Settings</h3>
          </div>
          <div className="space-y-2">
            <p>Base Resolution: 1920x1080</p>
            <p>Output Resolution: 1920x1080</p>
            <p>Downscale Filter: Lanczos</p>
            <p>FPS: 60</p>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Output Settings</h3>
          </div>
          <div className="space-y-2">
            <p>Encoder: x264</p>
            <p>Rate Control: CBR</p>
            <p>Bitrate: 6000 Kbps</p>
            <p>Keyframe Interval: 2</p>
            <p>CPU Usage Preset: veryfast</p>
            <p>Profile: high</p>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Audio Settings</h3>
          </div>
          <div className="space-y-2">
            <p>Sample Rate: 48khz</p>
            <p>Channels: Stereo</p>
            <p>Desktop Audio: Enable</p>
            <p>Mic/Auxiliary: Enable</p>
          </div>
        </Card>
      </div>

      <Card className="p-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Quick Tips</h3>
        </div>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            Test your stream before going live
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            Monitor your CPU usage while streaming
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            Use Game Capture for better performance
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            Set up hotkeys for quick scene switching
          </li>
        </ul>
      </Card>
    </div>
  );
};