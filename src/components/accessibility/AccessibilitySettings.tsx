import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function AccessibilitySettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    highContrast: false,
    screenReaderEnabled: false,
    reducedMotion: false,
    captionSize: "medium",
  });

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from("accessibility_settings")
      .select("*")
      .eq("user_id", user?.id)
      .single();

    if (error) {
      console.error("Error loading accessibility settings:", error);
      return;
    }

    if (data) {
      setSettings({
        highContrast: data.high_contrast,
        screenReaderEnabled: data.screen_reader_enabled,
        reducedMotion: data.reduced_motion,
        captionSize: data.caption_size,
      });
      applySettings(data);
    }
  };

  const applySettings = (settings: any) => {
    if (settings.high_contrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }

    if (settings.reduced_motion) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }
  };

  const updateSetting = async (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    const { error } = await supabase
      .from("accessibility_settings")
      .upsert({
        user_id: user?.id,
        high_contrast: newSettings.highContrast,
        screen_reader_enabled: newSettings.screenReaderEnabled,
        reduced_motion: newSettings.reducedMotion,
        caption_size: newSettings.captionSize,
      });

    if (error) {
      toast.error("Failed to update settings");
      return;
    }

    applySettings(newSettings);
    toast.success("Settings updated successfully");
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Accessibility Settings</h2>
        <p className="text-muted-foreground">
          Customize your viewing experience
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="high-contrast">High Contrast</Label>
          <Switch
            id="high-contrast"
            checked={settings.highContrast}
            onCheckedChange={(checked) => updateSetting("highContrast", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="screen-reader">Screen Reader Support</Label>
          <Switch
            id="screen-reader"
            checked={settings.screenReaderEnabled}
            onCheckedChange={(checked) =>
              updateSetting("screenReaderEnabled", checked)
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="reduced-motion">Reduced Motion</Label>
          <Switch
            id="reduced-motion"
            checked={settings.reducedMotion}
            onCheckedChange={(checked) => updateSetting("reducedMotion", checked)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="caption-size">Caption Size</Label>
          <Select
            value={settings.captionSize}
            onValueChange={(value) => updateSetting("captionSize", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select caption size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}