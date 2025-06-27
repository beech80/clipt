import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Shield, X } from "lucide-react";
import { toast } from "sonner";
// We'll avoid using socket.io directly in the component for now

interface ChatModerationSettingsProps {
  userId: string;
  roomId?: string;
}

// Helper functions for CAPS example visualization
const getCapsExample = (capsPercent: number): string => {
  // Create example text with exactly the capsPercent of capital letters
  const totalChars = 10;
  const capsChars = Math.round((capsPercent / 100) * totalChars);
  const lowerChars = totalChars - capsChars;
  
  return 'A'.repeat(capsChars) + 'a'.repeat(lowerChars);
};

const getCapsExampleColor = (capsPercent: number): string => {
  // Color gradient from green (0%) to yellow (50%) to red (100%)
  if (capsPercent < 30) return '#4ade80'; // Green
  if (capsPercent < 60) return '#facc15'; // Yellow
  return '#ef4444'; // Red
};

export const ChatModerationSettings = ({ userId, roomId = "default" }: ChatModerationSettingsProps) => {
  // Moderation settings with local state only
  const [moderationSettings, setModerationSettings] = useState({
    slowMode: true,
    slowModeSeconds: 3,
    allowLinks: false,
    capsLimitPercent: 70,
    bannedWords: [
      "badword",
      "offensive",
      "inappropriate"
    ] as string[]
  });
  
  // Custom banned word input
  const [bannedWordInput, setBannedWordInput] = useState("");
  
  // For demonstration purposes - in production this would connect to the chat server
  const [connected, setConnected] = useState(true);
  
  // Update moderation settings
  const updateModerationSettings = () => {
    try {
      // Save to localStorage for persistence
      localStorage.setItem(`chat-moderation-${userId}`, JSON.stringify(moderationSettings));
      
      // Provide success feedback to the user
      toast.success("Chat moderation settings saved successfully");
      
      // Log the settings for debugging
      console.log("Chat moderation settings saved:", moderationSettings);
      
      // In a production environment, this would also send the settings to the chat server
    } catch (error) {
      console.error("Error saving chat moderation settings:", error);
      toast.error("Failed to save chat moderation settings");
    }
  };
  
  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(`chat-moderation-${userId}`);
    if (savedSettings) {
      try {
        setModerationSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error("Error loading saved moderation settings", e);
      }
    }
  }, [userId]);
  
  // Add banned word
  const addBannedWord = () => {
    if (!bannedWordInput.trim()) {
      toast.error("Please enter a word to ban");
      return;
    }
    
    const wordToAdd = bannedWordInput.trim().toLowerCase();
    
    if (moderationSettings.bannedWords.includes(wordToAdd)) {
      toast.error(`"${wordToAdd}" is already in the banned list`);
      return;
    }
    
    const updatedSettings = {
      ...moderationSettings,
      bannedWords: [...moderationSettings.bannedWords, wordToAdd]
    };
    
    setModerationSettings(updatedSettings);
    setBannedWordInput("");
    toast.success(`"${wordToAdd}" added to banned list`);
    
    // For demonstration: save to localStorage immediately
    try {
      localStorage.setItem(`chat-moderation-${userId}`, JSON.stringify(updatedSettings));
    } catch (e) {
      console.error("Error saving banned word", e);
    }
  };
  
  // Remove banned word
  const removeBannedWord = (word: string) => {
    const updatedSettings = {
      ...moderationSettings,
      bannedWords: moderationSettings.bannedWords.filter(w => w !== word)
    };
    
    setModerationSettings(updatedSettings);
    toast.success(`"${word}" removed from banned list`);
    
    // For demonstration: save to localStorage immediately
    try {
      localStorage.setItem(`chat-moderation-${userId}`, JSON.stringify(updatedSettings));
    } catch (e) {
      console.error("Error removing banned word", e);
    }
  };
  
  // When any setting changes, store settings in localStorage immediately
  useEffect(() => {
    // Skip the initial render
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(`chat-moderation-${userId}`, JSON.stringify(moderationSettings));
      } catch (e) {
        console.error("Error auto-saving moderation settings", e);
      }
    }, 500); // Small delay to avoid too frequent updates
    
    return () => clearTimeout(timer);
  }, [moderationSettings, userId]);
  
  return (
    <Card className="p-6 w-full bg-card shadow-sm border-0" style={{
      background: "#2A1A12",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
      border: "1px solid #3A2A22",
      position: "relative",
      overflow: "hidden",
      color: "white",
      marginTop: "20px",
      marginBottom: "40px" // Add more margin to ensure it's visible
    }}>
      <div style={{ 
        position: "absolute", 
        top: 0, 
        left: 0, 
        width: "100%", 
        height: "4px", 
        background: "linear-gradient(90deg, #5539cc, #7B68EE)" 
      }} />
      
      <div className="flex items-center gap-3 mb-6">
        <div style={{ 
          background: "linear-gradient(135deg, #5539cc, #7B68EE)", 
          width: "36px", 
          height: "36px", 
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 6px rgba(123, 104, 238, 0.3)"
        }}>
          <Shield className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-white">Chat Moderation</h2>
        <div className="ml-auto">
          <Badge variant={connected ? "default" : "destructive"}>
            {connected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </div>
      
      <div className="space-y-4 relative">
        <div style={{
          position: "absolute",
          right: "-10px",
          bottom: "-10px",
          width: "90px",
          height: "90px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(123, 104, 238, 0.1) 0%, rgba(123, 104, 238, 0) 70%)",
          zIndex: 0
        }}></div>
        
        {/* Slow Mode Settings */}
        <div className="flex items-center justify-between relative z-10 hover:bg-white/10 p-2 rounded-lg transition-colors duration-200">
          <div className="space-y-0.5">
            <Label className="text-white">Slow Mode</Label>
            <p className="text-sm text-gray-400">
              Limit how often users can send messages
            </p>
          </div>
          <Switch
            checked={moderationSettings.slowMode}
            onCheckedChange={(checked) => {
              setModerationSettings({...moderationSettings, slowMode: checked});
            }}
            className="purple-toggle"
          />
        </div>
        
        {moderationSettings.slowMode && (
          <div className="pl-6 pr-2 py-2 bg-white/5 rounded-lg">
            <div className="flex flex-col gap-1">
              <Label className="text-sm text-white mb-2">
                Delay between messages: <span className="text-purple-400 font-bold">{moderationSettings.slowModeSeconds}</span> seconds
              </Label>
              <Slider
                value={[moderationSettings.slowModeSeconds]}
                min={1}
                max={30}
                step={1}
                onValueChange={(value) => {
                  setModerationSettings({...moderationSettings, slowModeSeconds: value[0]});
                  // Provide immediate feedback
                  toast.success(`Slow mode set to ${value[0]} seconds`);
                }}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Fast (1s)</span>
                <span>Normal (15s)</span>
                <span>Slow (30s)</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Links Filter */}
        <div className="flex items-center justify-between relative z-10 hover:bg-white/10 p-2 rounded-lg transition-colors duration-200">
          <div className="space-y-0.5">
            <Label className="text-white">Allow Links</Label>
            <p className="text-sm text-gray-400">
              Permit users to post URLs in chat
            </p>
          </div>
          <Switch
            checked={moderationSettings.allowLinks}
            onCheckedChange={(checked) => {
              setModerationSettings({...moderationSettings, allowLinks: checked});
            }}
            className="purple-toggle"
          />
        </div>
        
        {/* CAPS Filter */}
        <div className="flex items-center justify-between relative z-10 hover:bg-white/10 p-2 rounded-lg transition-colors duration-200">
          <div className="space-y-0.5">
            <Label className="text-white">CAPS Limit</Label>
            <p className="text-sm text-gray-400">
              Maximum percentage of capital letters allowed
            </p>
            <div className="flex items-center mt-2">
              <span className="text-xs mr-2">Example:</span>
              <span 
                className="text-xs px-2 py-1 rounded" 
                style={{
                  background: getCapsExampleColor(moderationSettings.capsLimitPercent),
                  color: moderationSettings.capsLimitPercent > 50 ? '#000' : '#fff'
                }}
              >
                {getCapsExample(moderationSettings.capsLimitPercent)}
              </span>
            </div>
          </div>
          <div className="w-1/3">
            <Slider
              value={[moderationSettings.capsLimitPercent]}
              min={0}
              max={100}
              step={5}
              onValueChange={(value) => {
                setModerationSettings({...moderationSettings, capsLimitPercent: value[0]});
                // Don't toast every small change
                if (value[0] % 25 === 0) {
                  toast.success(`CAPS limit set to ${value[0]}%`);
                }
              }}
              className="w-full"
            />
            <p className="text-xs text-center text-white font-bold mt-1">
              <span className="text-purple-400">{moderationSettings.capsLimitPercent}%</span> maximum
            </p>
          </div>
        </div>
        
        {/* Banned Words */}
        <div className="space-y-2 relative z-10 hover:bg-white/10 p-2 rounded-lg transition-colors duration-200">
          <Label className="text-white">Banned Words</Label>
          <p className="text-sm text-gray-400 mb-2">
            Add words that will be filtered from chat
          </p>
          
          <div className="flex gap-2 mb-2">
            <Input
              value={bannedWordInput}
              onChange={(e) => setBannedWordInput(e.target.value)}
              placeholder="Add word to ban..."
              className="bg-white/10 border-white/20 text-white"
              onKeyDown={(e) => e.key === "Enter" && addBannedWord()}
            />
            <Button 
              onClick={addBannedWord}
              variant="outline"
              className="bg-purple-600 hover:bg-purple-700 text-white border-0"
            >
              Add
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2">
            {moderationSettings.bannedWords.map((word, index) => (
              <Badge 
                key={index} 
                variant="secondary"
                className="bg-white/10 hover:bg-white/20 px-2 py-1 flex items-center gap-1"
              >
                {word}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-white/10 rounded-full"
                  onClick={() => removeBannedWord(word)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            {moderationSettings.bannedWords.length === 0 && (
              <p className="text-xs text-gray-400">No banned words added yet</p>
            )}
          </div>
        </div>
        
        {/* Save Button */}
        <Button 
          onClick={updateModerationSettings}
          className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white"
          disabled={!connected}
        >
          Save Moderation Settings
        </Button>
      </div>
    </Card>
  );
};

export default ChatModerationSettings;
