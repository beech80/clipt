import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield, LogOut, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SecuritySettingsProps {
  userId: string;
}

export const SecuritySettings = ({ userId }: SecuritySettingsProps) => {
  const { signOut } = useAuth();
  
  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    contactVerification: false
  });
  
  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(`security-settings-${userId}`);
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSecuritySettings(parsedSettings);
        console.log("Loaded security settings:", parsedSettings);
      } catch (e) {
        console.error("Error loading saved security settings", e);
      }
    } else {
      // If no settings found, save default settings
      localStorage.setItem(`security-settings-${userId}`, JSON.stringify(securitySettings));
      console.log("Initialized default security settings");
    }
  }, [userId]);
  
  // Update a specific security setting
  const updateSetting = (setting: keyof typeof securitySettings, value: boolean) => {
    const newSettings = { ...securitySettings, [setting]: value };
    setSecuritySettings(newSettings);
    
    // Save to localStorage
    try {
      localStorage.setItem(`security-settings-${userId}`, JSON.stringify(newSettings));
      
      if (setting === 'twoFactorAuth') {
        if (value) {
          toast.success("Two-Factor Authentication enabled");
        } else {
          toast.success("Two-Factor Authentication disabled");
        }
      } else if (setting === 'contactVerification') {
        if (value) {
          toast.success("Contact verification enabled");
        } else {
          toast.success("Contact verification disabled");
        }
      }
    } catch (e) {
      console.error("Error saving security settings", e);
      toast.error("Failed to save security settings");
    }
  };
  
  // Handle sign out
  const handleSignOut = () => {
    toast.success("Signed out successfully");
    console.log("User signing out...");
    
    // For demo purposes, just show the toast and log it
    if (typeof signOut === 'function') {
      setTimeout(() => {
        console.log("Executing signOut function");
        signOut();
      }, 1000);
    } else {
      console.log("No signOut function available, this is a demo");
      // In demo mode, redirect to home after a delay
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    }
  };
  
  // Handle export user data
  const handleExportData = () => {
    const userData = {
      userId,
      settings: {
        security: securitySettings,
        // In a real app, we would gather all user data here
      },
      exportDate: new Date().toISOString()
    };
    
    // Create downloadable file
    const dataStr = JSON.stringify(userData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    // Create download link and click it
    const exportFileDefaultName = `clipt-user-data-${userId}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success("User data exported successfully");
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
          <Shield className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-white">Security & Account</h2>
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
        
        {/* Two-Factor Authentication */}
        <div className="flex items-center justify-between relative z-10 hover:bg-white/10 p-2 rounded-lg transition-colors duration-200">
          <div className="space-y-0.5">
            <Label className="text-white">Two-Factor Authentication (2FA)</Label>
            <p className="text-sm text-gray-400">
              Secure your account with additional verification
            </p>
          </div>
          <Switch
            checked={securitySettings.twoFactorAuth}
            onCheckedChange={(checked) => updateSetting('twoFactorAuth', checked)}
            className="orange-toggle"
          />
        </div>
        
        {/* Email & Phone Verification */}
        <div className="flex items-center justify-between relative z-10 hover:bg-white/10 p-2 rounded-lg transition-colors duration-200">
          <div className="space-y-0.5">
            <Label className="text-white">Email & Phone Verification</Label>
            <p className="text-sm text-gray-400">
              Verify your contact methods for security
            </p>
          </div>
          <Switch
            checked={securitySettings.contactVerification}
            onCheckedChange={(checked) => updateSetting('contactVerification', checked)}
            className="orange-toggle"
          />
        </div>
        
        {/* Separator */}
        <div className="h-px bg-white/10 my-4"></div>
        
        {/* Sign Out Button */}
        <Button 
          onClick={handleSignOut}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white border-0 flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
        
        {/* Export User Data Button */}
        <Button 
          onClick={handleExportData}
          variant="outline" 
          className="w-full border-white/20 hover:bg-white/10 text-white flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export User Data
        </Button>
      </div>
    </Card>
  );
};

export default SecuritySettings;
