
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Paintbrush, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { CustomTheme } from "@/types/profile";

interface ThemeColors {
  primary: string;
  secondary: string;
}

const defaultTheme: ThemeColors = {
  primary: "#9b87f5",
  secondary: "#1A1F2C"
};

export const ThemeSelector = ({ userId, currentTheme }: { userId: string; currentTheme: ThemeColors }) => {
  const [theme, setTheme] = useState<ThemeColors>(currentTheme || defaultTheme);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          custom_theme: theme
        })
        .eq('id', userId);

      if (error) throw error;

      // Update CSS variables
      document.documentElement.style.setProperty('--background-override', theme.secondary);
      document.documentElement.style.setProperty('--button-override', theme.primary);
      
      toast.success("Theme updated successfully!");
    } catch (error) {
      console.error('Error updating theme:', error);
      toast.error("Failed to update theme");
    } finally {
      setIsLoading(false);
    }
  };

  const handleColorChange = (color: string, type: 'primary' | 'secondary') => {
    setTheme(prev => ({ ...prev, [type]: color }));
    
    // Update CSS variables in real-time for preview
    if (type === 'primary') {
      document.documentElement.style.setProperty('--button-override', color);
    } else {
      document.documentElement.style.setProperty('--background-override', color);
    }
  };

  const handleResetToDefault = () => {
    setTheme(defaultTheme);
    document.documentElement.style.setProperty('--background-override', defaultTheme.secondary);
    document.documentElement.style.setProperty('--button-override', defaultTheme.primary);
    toast.info("Reset to default theme");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Paintbrush className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Custom Theme</h3>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleResetToDefault}
          title="Reset to default theme"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="primary">Primary Color</Label>
          <div className="flex gap-2">
            <Input
              id="primary"
              type="color"
              value={theme.primary}
              onChange={(e) => handleColorChange(e.target.value, 'primary')}
              className="w-16 h-10 p-1"
            />
            <Input
              type="text"
              value={theme.primary}
              onChange={(e) => handleColorChange(e.target.value, 'primary')}
              className="flex-1"
              placeholder="#9b87f5"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="secondary">Background Color</Label>
          <div className="flex gap-2">
            <Input
              id="secondary"
              type="color"
              value={theme.secondary}
              onChange={(e) => handleColorChange(e.target.value, 'secondary')}
              className="w-16 h-10 p-1"
            />
            <Input
              type="text"
              value={theme.secondary}
              onChange={(e) => handleColorChange(e.target.value, 'secondary')}
              className="flex-1"
              placeholder="#1A1F2C"
            />
          </div>
        </div>

        <div className="pt-2">
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Saving..." : "Save Theme"}
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Preview</h4>
        <div className="grid gap-2">
          <div 
            className="h-8 rounded"
            style={{ backgroundColor: theme.primary }}
          />
          <div 
            className="h-8 rounded"
            style={{ backgroundColor: theme.secondary }}
          />
        </div>
      </div>
    </div>
  );
};
