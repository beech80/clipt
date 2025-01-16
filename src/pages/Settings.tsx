import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Settings = () => {
  const [backgroundColor, setBackgroundColor] = useState("#1A1F2C");
  const [buttonColor, setButtonColor] = useState("#9b87f5");
  const [textColor, setTextColor] = useState("#FFFFFF");

  const colorOptions = {
    backgrounds: [
      { name: "Dark Purple", value: "#1A1F2C" },
      { name: "Charcoal", value: "#221F26" },
      { name: "Navy", value: "#1E2433" },
      { name: "Deep Gray", value: "#2A2A2A" },
    ],
    buttons: [
      { name: "Gaming Purple", value: "#9b87f5" },
      { name: "Vivid Purple", value: "#8B5CF6" },
      { name: "Ocean Blue", value: "#0EA5E9" },
      { name: "Bright Blue", value: "#1EAEDB" },
    ],
    text: [
      { name: "White", value: "#FFFFFF" },
      { name: "Light Gray", value: "#F6F6F7" },
      { name: "Soft White", value: "#EFEFEF" },
      { name: "Cool Gray", value: "#E5E7EB" },
    ]
  };

  const applyColors = () => {
    document.documentElement.style.setProperty('--background-override', backgroundColor);
    document.documentElement.style.setProperty('--button-override', buttonColor);
    document.documentElement.style.setProperty('--text-override', textColor);
    toast.success("Theme updated successfully!");
  };

  const ColorPicker = ({ 
    label, 
    value, 
    onChange, 
    options 
  }: { 
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { name: string; value: string; }[];
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`h-12 rounded-md border-2 transition-all ${
              value === option.value 
                ? 'border-gaming-400 shadow-lg scale-105' 
                : 'border-transparent hover:border-gaming-400/50'
            }`}
            style={{ backgroundColor: option.value }}
          >
            <span className="sr-only">{option.name}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container py-8 space-y-8">
      <h1 className="text-2xl font-bold gaming-gradient">Theme Settings</h1>
      
      <Card className="p-6 space-y-6 gaming-card">
        <ColorPicker
          label="Background Color"
          value={backgroundColor}
          onChange={setBackgroundColor}
          options={colorOptions.backgrounds}
        />

        <ColorPicker
          label="Button Color"
          value={buttonColor}
          onChange={setButtonColor}
          options={colorOptions.buttons}
        />

        <ColorPicker
          label="Text Color"
          value={textColor}
          onChange={setTextColor}
          options={colorOptions.text}
        />

        <Button 
          onClick={applyColors}
          className="w-full gaming-button"
        >
          Apply Theme
        </Button>
      </Card>
    </div>
  );
};

export default Settings;