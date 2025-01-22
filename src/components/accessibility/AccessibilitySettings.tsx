import { useEffect } from "react";
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
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export function AccessibilitySettings() {
  const { user } = useAuth();
  const {
    highContrast,
    screenReaderEnabled,
    reducedMotion,
    captionSize,
    focusRingColor,
    setHighContrast,
    setScreenReaderEnabled,
    setReducedMotion,
    setCaptionSize,
    setFocusRingColor,
  } = useAccessibility();

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
      setHighContrast(data.high_contrast);
      setScreenReaderEnabled(data.screen_reader_enabled);
      setReducedMotion(data.reduced_motion);
      setCaptionSize(data.caption_size);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    const { error } = await supabase
      .from("accessibility_settings")
      .upsert({
        user_id: user?.id,
        [key]: value,
      });

    if (error) {
      toast.error("Failed to update settings");
      return;
    }

    toast.success("Settings updated successfully");
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold" tabIndex={0}>Accessibility Settings</h2>
        <p className="text-muted-foreground">
          Customize your viewing experience
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="high-contrast">High Contrast</Label>
          <Switch
            id="high-contrast"
            checked={highContrast}
            onCheckedChange={(checked) => {
              setHighContrast(checked);
              updateSetting("high_contrast", checked);
            }}
            aria-label="Toggle high contrast mode"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="screen-reader">Screen Reader Support</Label>
          <Switch
            id="screen-reader"
            checked={screenReaderEnabled}
            onCheckedChange={(checked) => {
              setScreenReaderEnabled(checked);
              updateSetting("screen_reader_enabled", checked);
            }}
            aria-label="Toggle screen reader optimizations"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="reduced-motion">Reduced Motion</Label>
          <Switch
            id="reduced-motion"
            checked={reducedMotion}
            onCheckedChange={(checked) => {
              setReducedMotion(checked);
              updateSetting("reduced_motion", checked);
            }}
            aria-label="Toggle reduced motion"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="caption-size">Caption Size</Label>
          <Select
            value={captionSize}
            onValueChange={(value: "small" | "medium" | "large") => {
              setCaptionSize(value);
              updateSetting("caption_size", value);
            }}
          >
            <SelectTrigger id="caption-size" aria-label="Select caption size">
              <SelectValue placeholder="Select caption size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="focus-ring-color">Focus Ring Color</Label>
          <Input
            id="focus-ring-color"
            type="color"
            value={focusRingColor}
            onChange={(e) => {
              setFocusRingColor(e.target.value);
              updateSetting("focus_ring_color", e.target.value);
            }}
            aria-label="Choose focus ring color"
            className="h-10 p-1"
          />
        </div>
      </div>
    </Card>
  );
}