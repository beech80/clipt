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
import { MainNav } from "@/components/MainNav";

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
      return data;
    },
    enabled: !!user?.id
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
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

  const handleToggle = (setting: string) => {
    if (!profile) return;
    
    updateSettingsMutation.mutate({
      [setting]: !profile[setting]
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <div className="container mx-auto py-6 space-y-8">
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

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <UserCog className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-semibold">Account Settings</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about activity
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

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-semibold">Privacy & Security</h2>
              </div>
              <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Shield className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">Coming soon</p>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            {profile && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Paintbrush className="w-5 h-5 text-purple-500" />
                  <h2 className="text-xl font-semibold">Theme Customization</h2>
                </div>
                <ThemeSelector 
                  userId={profile.id} 
                  currentTheme={profile.custom_theme}
                />
              </Card>
            )}

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-semibold">Notification Preferences</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Configure how you receive notifications and updates
              </p>
              <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Bell className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">Coming soon</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;