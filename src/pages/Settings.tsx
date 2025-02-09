
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
import { AccessibilitySettings } from "@/components/accessibility/AccessibilitySettings";
import { TwoFactorSettings } from "@/components/settings/TwoFactorSettings";
import { DataPrivacySettings } from "@/components/settings/DataPrivacySettings";
import { StreamSettings } from "@/components/streaming/StreamSettings";
import {
  Bell,
  Volume2,
  Moon,
  Paintbrush,
  Shield,
  UserCog,
  ArrowLeft,
  Settings as SettingsIcon,
  Layout,
  MessageSquare,
  Globe,
  Video,
  BookOpen
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
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Loading your settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">
                Manage your account settings and preferences
              </p>
            </div>
          </div>
        </div>
        <Separator />
      </div>

      {/* Settings Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column - Account & Security */}
        <div className="space-y-6">
          {/* Account Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <UserCog className="w-5 h-5 text-purple-500" />
              <h2 className="text-xl font-semibold">Account Settings</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications about activity
                  </p>
                </div>
                <Switch
                  checked={profile?.enable_notifications}
                  onCheckedChange={() => handleToggle('enable_notifications')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sound Effects</Label>
                  <p className="text-sm text-muted-foreground">
                    Play sounds for interactions
                  </p>
                </div>
                <Switch
                  checked={profile?.enable_sounds}
                  onCheckedChange={() => handleToggle('enable_sounds')}
                />
              </div>
            </div>
          </Card>

          {/* Documentation Section */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="w-5 h-5 text-purple-500" />
              <h2 className="text-xl font-semibold">Documentation</h2>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Access our comprehensive documentation, including user guides, API documentation, and community guidelines.
              </p>
              <Button 
                onClick={() => navigate('/docs/user-guide')}
                className="w-full"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                View Documentation
              </Button>
            </div>
          </Card>

          {/* Security Settings */}
          <TwoFactorSettings />
          <DataPrivacySettings />
        </div>

        {/* Right Column - Appearance & Accessibility */}
        <div className="space-y-6">
          {/* Appearance Settings */}
          {profile && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Paintbrush className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-semibold">Appearance</h2>
              </div>
              <ThemeSelector 
                userId={profile.id} 
                currentTheme={profile.custom_theme}
              />
            </Card>
          )}

          {/* Accessibility Settings */}
          <AccessibilitySettings />
          
          {/* Streaming Settings */}
          {user && <StreamSettings userId={user.id} />}
        </div>
      </div>
    </div>
  );
};

export default Settings;
