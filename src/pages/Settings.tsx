import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ThemeSelector } from "@/components/profile/ThemeSelector";
import {
  Bell,
  Volume2,
  Moon,
  Paintbrush,
  Shield,
  UserCog,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Profile, CustomTheme, DatabaseProfile } from "@/types/profile";

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      
      const dbProfile = data as DatabaseProfile;
      const customTheme = dbProfile.custom_theme as CustomTheme || {
        primary: "#1EAEDB",
        secondary: "#1A1F2C"
      };

      return {
        ...dbProfile,
        custom_theme: customTheme
      } as Profile;
    },
    enabled: !!user?.id
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<DatabaseProfile>) => {
      const { error } = await supabase
        .from('profiles')
        .update(settings)
        .eq('id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Settings updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update settings");
      console.error("Settings update error:", error);
    }
  });

  const handleToggle = (setting: keyof Profile) => {
    if (!profile) return;
    
    updateSettingsMutation.mutate({
      [setting]: !profile[setting]
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1A1F2C]">
        <div className="animate-pulse text-gaming-400">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1F2C] text-white">
      <div className="container mx-auto py-6 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate(-1)}
                className="hover:bg-gaming-800/50"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gaming-500 to-gaming-300">
                  Settings
                </h1>
                <p className="text-gaming-400">
                  Manage your account settings and preferences
                </p>
              </div>
            </div>
          </div>
          <Separator className="bg-gaming-700/50" />
        </div>

        {/* Settings Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            <Card className="p-6 bg-gaming-900/40 border-gaming-700/50 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-6">
                <UserCog className="w-5 h-5 text-gaming-400" />
                <h2 className="text-xl font-semibold text-gaming-100">Account Settings</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-gaming-200">Notifications</Label>
                    <p className="text-sm text-gaming-400">
                      Receive notifications about activity
                    </p>
                  </div>
                  <Switch
                    checked={profile?.enable_notifications}
                    onCheckedChange={() => handleToggle('enable_notifications')}
                    className="data-[state=checked]:bg-gaming-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-gaming-200">Sound Effects</Label>
                    <p className="text-sm text-gaming-400">
                      Play sounds for interactions
                    </p>
                  </div>
                  <Switch
                    checked={profile?.enable_sounds}
                    onCheckedChange={() => handleToggle('enable_sounds')}
                    className="data-[state=checked]:bg-gaming-500"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gaming-900/40 border-gaming-700/50 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-gaming-400" />
                <h2 className="text-xl font-semibold text-gaming-100">Privacy & Security</h2>
              </div>
              <div className="text-center p-8 bg-gaming-800/50 rounded-lg">
                <Shield className="w-8 h-8 mx-auto text-gaming-400 mb-2" />
                <p className="text-gaming-400">Coming soon</p>
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {profile && (
              <Card className="p-6 bg-gaming-900/40 border-gaming-700/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-6">
                  <Paintbrush className="w-5 h-5 text-gaming-400" />
                  <h2 className="text-xl font-semibold text-gaming-100">Theme Customization</h2>
                </div>
                <ThemeSelector 
                  userId={profile.id} 
                  currentTheme={profile.custom_theme}
                />
              </Card>
            )}

            <Card className="p-6 bg-gaming-900/40 border-gaming-700/50 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-gaming-400" />
                <h2 className="text-xl font-semibold text-gaming-100">Notification Preferences</h2>
              </div>
              <p className="text-gaming-400 mb-4">
                Configure how you receive notifications and updates
              </p>
              <div className="text-center p-8 bg-gaming-800/50 rounded-lg">
                <Bell className="w-8 h-8 mx-auto text-gaming-400 mb-2" />
                <p className="text-gaming-400">Coming soon</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;