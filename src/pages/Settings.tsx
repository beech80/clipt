import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import GameBoyControls from "@/components/GameBoyControls";
import { useTheme } from "@/components/ThemeProvider";
import { Moon, Sun } from "lucide-react";

export default function Settings() {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    toast.success(`Theme changed to ${newTheme}`);
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 pb-40">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <Card className="p-6 bg-background/80 backdrop-blur-sm border">
        <h2 className="text-xl font-semibold mb-6">Theme Settings</h2>
        
        <div className="flex flex-col space-y-4">
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => handleThemeChange('light')}
          >
            <Sun className="h-4 w-4 mr-2" />
            Light Mode
          </Button>
          
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => handleThemeChange('dark')}
          >
            <Moon className="h-4 w-4 mr-2" />
            Dark Mode
          </Button>
          
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => handleThemeChange('system')}
          >
            <Sun className="h-4 w-4 mr-2" />
            System Default
          </Button>
        </div>
      </Card>
      <GameBoyControls />
    </div>
  );
}