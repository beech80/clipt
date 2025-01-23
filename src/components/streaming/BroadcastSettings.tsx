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
import { BroadcastSettings as BroadcastSettingsType } from "@/types/broadcast";

const defaultSettings: Omit<BroadcastSettingsType, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  encoder_settings: {
    fps: 30,
    resolution: "1920x1080",
    audio_bitrate: 160,
    video_bitrate: 2500
  },
  output_settings: {
    platform: "custom",
    server_url: "",
    stream_key: ""
  }
};

export function BroadcastSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<BroadcastSettingsType | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['broadcast-settings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('broadcast_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      // Parse the JSONB fields
      if (data) {
        return {
          ...data,
          encoder_settings: data.encoder_settings as BroadcastSettingsType['encoder_settings'],
          output_settings: data.output_settings as BroadcastSettingsType['output_settings']
        } as BroadcastSettingsType;
      }
      return null;
    },
    enabled: !!user?.id
  });

  useEffect(() => {
    if (data) {
      setSettings(data);
    } else if (!isLoading && user?.id) {
      // Initialize with default settings if no data exists
      setSettings({
        ...defaultSettings,
        id: '',
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  }, [data, isLoading, user?.id]);

  const updateSettings = useMutation({
    mutationFn: async (newSettings: BroadcastSettingsType) => {
      const { data, error } = await supabase
        .from('broadcast_settings')
        .upsert({
          user_id: user?.id,
          encoder_settings: newSettings.encoder_settings,
          output_settings: newSettings.output_settings
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
                  <SelectItem value="1920x1080">1920x1080</SelectItem>
                  <SelectItem value="1280x720">1280x720</SelectItem>
                  <SelectItem value="854x480">854x480</SelectItem>
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