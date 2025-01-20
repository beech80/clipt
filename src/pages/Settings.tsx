import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataPrivacySettings } from "@/components/settings/DataPrivacySettings";
import { TwoFactorSettings } from "@/components/settings/TwoFactorSettings";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { ThemeSelector } from "@/components/profile/ThemeSelector";
import { AccessibilitySettings } from "@/components/accessibility/AccessibilitySettings";
import { KeyboardShortcuts } from "@/components/keyboard/KeyboardShortcuts";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Settings = () => {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const handleNotificationToggle = async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ enable_notifications: enabled })
        .eq('id', user?.id);

      if (error) throw error;
      toast.success("Notification settings updated");
    } catch (error) {
      toast.error("Failed to update notification settings");
      console.error(error);
    }
  };

  const handleSoundToggle = async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ enable_sounds: enabled })
        .eq('id', user?.id);

      if (error) throw error;
      toast.success("Sound settings updated");
    } catch (error) {
      toast.error("Failed to update sound settings");
      console.error(error);
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto py-6 space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileEditForm />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <ThemeSelector userId={user.id} currentTheme={profile?.custom_theme || { primary: "#9b87f5", secondary: "#1A1F2C" }} />
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Theme Preference</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="theme-preference">Dark Mode</Label>
                <Switch 
                  id="theme-preference"
                  checked={profile?.theme_preference === 'dark'}
                  onCheckedChange={async (checked) => {
                    try {
                      const { error } = await supabase
                        .from('profiles')
                        .update({ theme_preference: checked ? 'dark' : 'light' })
                        .eq('id', user.id);
                      
                      if (error) throw error;
                      toast.success("Theme preference updated");
                    } catch (error) {
                      toast.error("Failed to update theme preference");
                      console.error(error);
                    }
                  }}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications">Enable Notifications</Label>
                <Switch 
                  id="notifications"
                  checked={profile?.enable_notifications}
                  onCheckedChange={handleNotificationToggle}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sounds">Enable Sounds</Label>
                <Switch 
                  id="sounds"
                  checked={profile?.enable_sounds}
                  onCheckedChange={handleSoundToggle}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="accessibility" className="space-y-6">
          <AccessibilitySettings />
          <KeyboardShortcuts />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;