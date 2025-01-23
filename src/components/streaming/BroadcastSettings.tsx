import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Settings, Save } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface BroadcastSettings {
  id: string;
  encoder_settings: {
    fps: number;
    resolution: string;
    audio_bitrate: number;
    video_bitrate: number;
  };
  output_settings: {
    platform: string;
    server_url: string;
    stream_key: string;
  };
}

const resolutions = [
  "1920x1080",
  "1280x720",
  "854x480",
  "640x360"
];

const platforms = [
  { value: "custom", label: "Custom RTMP" },
  { value: "twitch", label: "Twitch" },
  { value: "youtube", label: "YouTube" }
];

export function BroadcastSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<BroadcastSettings | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['broadcast-settings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('broadcast_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as BroadcastSettings;
    },
    enabled: !!user?.id
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<BroadcastSettings>) => {
      const { data, error } = await supabase
        .from('broadcast_settings')
        .upsert({
          user_id: user?.id,
          ...newSettings
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Settings saved successfully");
    },
    onError: () => {
      toast.error("Failed to save settings");
    }
  });

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  if (isLoading || !settings) {
    return <div>Loading settings...</div>;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5" />
        <h2 className="text-xl font-bold">Broadcast Settings</h2>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold">Encoder Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Resolution</Label>
              <Select
                value={settings.encoder_settings.resolution}
                onValueChange={(value) => setSettings({
                  ...settings,
                  encoder_settings: {
                    ...settings.encoder_settings,
                    resolution: value
                  }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select resolution" />
                </SelectTrigger>
                <SelectContent>
                  {resolutions.map((res) => (
                    <SelectItem key={res} value={res}>{res}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>FPS</Label>
              <Input
                type="number"
                value={settings.encoder_settings.fps}
                onChange={(e) => setSettings({
                  ...settings,
                  encoder_settings: {
                    ...settings.encoder_settings,
                    fps: parseInt(e.target.value)
                  }
                })}
              />
            </div>

            <div className="space-y-2">
              <Label>Video Bitrate (kbps)</Label>
              <Input
                type="number"
                value={settings.encoder_settings.video_bitrate}
                onChange={(e) => setSettings({
                  ...settings,
                  encoder_settings: {
                    ...settings.encoder_settings,
                    video_bitrate: parseInt(e.target.value)
                  }
                })}
              />
            </div>

            <div className="space-y-2">
              <Label>Audio Bitrate (kbps)</Label>
              <Input
                type="number"
                value={settings.encoder_settings.audio_bitrate}
                onChange={(e) => setSettings({
                  ...settings,
                  encoder_settings: {
                    ...settings.encoder_settings,
                    audio_bitrate: parseInt(e.target.value)
                  }
                })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">Output Settings</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select
                value={settings.output_settings.platform}
                onValueChange={(value) => setSettings({
                  ...settings,
                  output_settings: {
                    ...settings.output_settings,
                    platform: value
                  }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.value} value={platform.value}>
                      {platform.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Server URL</Label>
              <Input
                value={settings.output_settings.server_url}
                onChange={(e) => setSettings({
                  ...settings,
                  output_settings: {
                    ...settings.output_settings,
                    server_url: e.target.value
                  }
                })}
              />
            </div>

            <div className="space-y-2">
              <Label>Stream Key</Label>
              <Input
                type="password"
                value={settings.output_settings.stream_key}
                onChange={(e) => setSettings({
                  ...settings,
                  output_settings: {
                    ...settings.output_settings,
                    stream_key: e.target.value
                  }
                })}
              />
            </div>
          </div>
        </div>

        <Button 
          className="w-full"
          onClick={() => updateSettings.mutate(settings)}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </Card>
  );
}