import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Gauge } from "lucide-react";

interface PerformanceSettingsProps {
  userId: string;
}

export const PerformanceSettings = ({ userId }: PerformanceSettingsProps) => {
  // Performance settings state
  const [performanceSettings, setPerformanceSettings] = useState({
    hardwareAcceleration: true,
    reduceAnimations: false,
    backgroundProcessing: true,
    followerNotifications: false
  });
  
  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(`performance-settings-${userId}`);
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setPerformanceSettings(parsedSettings);
        console.log("Loaded performance settings:", parsedSettings);
        
        // Apply settings to document
        applyPerformanceSettings(parsedSettings);
      } catch (e) {
        console.error("Error loading saved performance settings", e);
      }
    } else {
      // If no settings found, save default settings
      localStorage.setItem(`performance-settings-${userId}`, JSON.stringify(performanceSettings));
      console.log("Initialized default performance settings");
      
      // Apply default settings
      applyPerformanceSettings(performanceSettings);
    }
    
    // Add debug information to console for verification
    console.log("Performance settings component mounted for user:", userId);
  }, [userId]);
  
  // Apply performance settings to document
  const applyPerformanceSettings = (settings: typeof performanceSettings) => {
    // Hardware acceleration
    if (settings.hardwareAcceleration) {
      document.body.classList.add('hardware-accelerated');
    } else {
      document.body.classList.remove('hardware-accelerated');
    }
    
    // Reduce animations
    if (settings.reduceAnimations) {
      document.body.classList.add('reduce-animations');
    } else {
      document.body.classList.remove('reduce-animations');
    }
    
    // Background processing would typically register a service worker
    // This is just a placeholder for the actual implementation
    if (settings.backgroundProcessing) {
      console.log("Background processing enabled");
      // In production: registerServiceWorker();
    } else {
      console.log("Background processing disabled");
      // In production: unregisterServiceWorker();
    }
  };
  
  // Update a specific performance setting
  const updateSetting = (setting: keyof typeof performanceSettings, value: boolean) => {
    const newSettings = { ...performanceSettings, [setting]: value };
    setPerformanceSettings(newSettings);
    
    // Apply settings immediately
    applyPerformanceSettings(newSettings);
    
    // Save to localStorage
    try {
      localStorage.setItem(`performance-settings-${userId}`, JSON.stringify(newSettings));
      toast.success(`${setting.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())} ${value ? 'enabled' : 'disabled'}`);
    } catch (e) {
      console.error("Error saving performance settings", e);
      toast.error("Failed to save performance settings");
    }
  };
  
  return (
    <Card className="p-6 w-full bg-card shadow-sm border-0" style={{
      background: "#2A1A12",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
      border: "1px solid #3A2A22",
      position: "relative",
      overflow: "hidden",
      color: "white",
      marginTop: "20px"
    }}>
      <div style={{ 
        position: "absolute", 
        top: 0, 
        left: 0, 
        width: "100%", 
        height: "4px", 
        background: "linear-gradient(90deg, #FF5500, #FF7700)" 
      }} />
      
      <div className="flex items-center gap-3 mb-6">
        <div style={{ 
          background: "linear-gradient(135deg, #FF7700, #FF5500)", 
          width: "36px", 
          height: "36px", 
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 6px rgba(255, 119, 0, 0.3)"
        }}>
          <Gauge className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-white">Performance</h2>
      </div>
      
      <div className="space-y-4 relative">
        <div style={{
          position: "absolute",
          right: "-10px",
          bottom: "-10px",
          width: "90px",
          height: "90px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255, 85, 0, 0.1) 0%, rgba(255, 85, 0, 0) 70%)",
          zIndex: 0
        }}></div>
        
        {/* Hardware Acceleration */}
        <div className="flex items-center justify-between relative z-10 hover:bg-white/10 p-2 rounded-lg transition-colors duration-200">
          <div className="space-y-0.5">
            <Label className="text-white">Hardware Acceleration</Label>
            <p className="text-sm text-gray-400">
              Use GPU for better performance
            </p>
          </div>
          <Switch
            checked={performanceSettings.hardwareAcceleration}
            onCheckedChange={(checked) => updateSetting('hardwareAcceleration', checked)}
            className="orange-toggle"
          />
        </div>
        
        {/* Reduce Animations */}
        <div className="flex items-center justify-between relative z-10 hover:bg-white/10 p-2 rounded-lg transition-colors duration-200">
          <div className="space-y-0.5">
            <Label className="text-white">Reduce Animations</Label>
            <p className="text-sm text-gray-400">
              Disable animations for better performance
            </p>
          </div>
          <Switch
            checked={performanceSettings.reduceAnimations}
            onCheckedChange={(checked) => updateSetting('reduceAnimations', checked)}
            className="orange-toggle"
          />
        </div>
        
        {/* Background Processing */}
        <div className="flex items-center justify-between relative z-10 hover:bg-white/10 p-2 rounded-lg transition-colors duration-200">
          <div className="space-y-0.5">
            <Label className="text-white">Background Processing</Label>
            <p className="text-sm text-gray-400">
              Allow processing when app is in background
            </p>
          </div>
          <Switch
            checked={performanceSettings.backgroundProcessing}
            onCheckedChange={(checked) => updateSetting('backgroundProcessing', checked)}
            className="orange-toggle"
          />
        </div>
        
        {/* Follower Notifications */}
        <div className="flex items-center justify-between relative z-10 hover:bg-white/10 p-2 rounded-lg transition-colors duration-200">
          <div className="space-y-0.5">
            <Label className="text-white">Follower Notifications</Label>
            <p className="text-sm text-gray-400">
              Get notified about new followers
            </p>
          </div>
          <Switch
            checked={performanceSettings.followerNotifications}
            onCheckedChange={(checked) => updateSetting('followerNotifications', checked)}
            className="orange-toggle"
          />
        </div>
      </div>
    </Card>
  );
};

export default PerformanceSettings;
