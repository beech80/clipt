import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Settings() {
  const handleThemeChange = (theme: string) => {
    // Apply theme changes
    document.documentElement.setAttribute('data-theme', theme);
    toast.success(`Theme changed to ${theme}`);
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gaming-400 mb-8">Settings</h1>
      
      <Card className="p-6 bg-background/80 backdrop-blur-sm border-gaming-700/50">
        <h2 className="text-xl font-semibold mb-6 text-gaming-400">Theme Settings</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="h-24 border-2 border-gaming-700 hover:border-gaming-400"
            onClick={() => handleThemeChange('default')}
          >
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-gaming-400 mx-auto mb-2"></div>
              <span>Default</span>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="h-24 border-2 border-gaming-700 hover:border-gaming-400"
            onClick={() => handleThemeChange('dark')}
          >
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-[#1A1F2C] mx-auto mb-2"></div>
              <span>Dark</span>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="h-24 border-2 border-gaming-700 hover:border-gaming-400"
            onClick={() => handleThemeChange('light')}
          >
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-[#F1F0FB] mx-auto mb-2"></div>
              <span>Light</span>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="h-24 border-2 border-gaming-700 hover:border-gaming-400"
            onClick={() => handleThemeChange('purple')}
          >
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-[#9b87f5] mx-auto mb-2"></div>
              <span>Purple</span>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="h-24 border-2 border-gaming-700 hover:border-gaming-400"
            onClick={() => handleThemeChange('ocean')}
          >
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-[#0EA5E9] mx-auto mb-2"></div>
              <span>Ocean</span>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="h-24 border-2 border-gaming-700 hover:border-gaming-400"
            onClick={() => handleThemeChange('sunset')}
          >
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-[#F97316] mx-auto mb-2"></div>
              <span>Sunset</span>
            </div>
          </Button>
        </div>
      </Card>
    </div>
  );
}