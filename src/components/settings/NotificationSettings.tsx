import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Bell, AlertCircle } from "lucide-react";
import PushNotificationTest from "@/components/PushNotificationTest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NotificationSettingsProps {
  userId: string;
}

export const NotificationSettings = ({ userId }: NotificationSettingsProps) => {
  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: false,
    pushNotifications: false,
    streamAlerts: false
  });
  const [activeTab, setActiveTab] = useState("general");
  
  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(`notification-settings-${userId}`);
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setNotificationSettings(parsedSettings);
        console.log("Loaded notification settings:", parsedSettings);
      } catch (e) {
        console.error("Error loading saved notification settings", e);
      }
    } else {
      // If no settings found, save default settings
      localStorage.setItem(`notification-settings-${userId}`, JSON.stringify(notificationSettings));
      console.log("Initialized default notification settings");
    }
  }, [userId]);
  
  // Save settings when they change
  useEffect(() => {
    try {
      localStorage.setItem(`notification-settings-${userId}`, JSON.stringify(notificationSettings));
      console.log("Saved notification settings:", notificationSettings);
    } catch (e) {
      console.error("Error auto-saving notification settings", e);
    }
  }, [notificationSettings, userId]);
  
  // Update a specific notification setting
  const updateSetting = (setting: keyof typeof notificationSettings, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [setting]: value }));
    toast.success(`${setting} ${value ? 'enabled' : 'disabled'}`);
    
    // In a production app, this would send the settings to a server
    console.log("Updating notification setting:", setting, value);
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
          <Bell className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-white">Notifications</h2>
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
        
        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="push">Push Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive important updates via email</p>
              </div>
              <Switch 
                checked={notificationSettings.emailNotifications}
                onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Push Notifications</Label>
                <p className="text-sm text-gray-500">Allow browser push notifications</p>
              </div>
              <Switch 
                checked={notificationSettings.pushNotifications}
                onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Stream Alerts</Label>
                <p className="text-sm text-gray-500">Get notified when streams you follow go live</p>
              </div>
              <Switch 
                checked={notificationSettings.streamAlerts}
                onCheckedChange={(checked) => updateSetting('streamAlerts', checked)}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="push">
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                Push notifications require browser permissions and work even when you're not using the app. 
                Subscribe below to enable real-time alerts for messages, streams, and important updates.
              </p>
            </div>
            
            <PushNotificationTest />
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};

export default NotificationSettings;
