
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { ThemeSelector } from "@/components/profile/ThemeSelector";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserCog, Paintbrush, Shield, Bell, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import GameBoyControls from "@/components/GameBoyControls";
import type { CustomTheme } from "@/types/profile";

const EditProfile = () => {
  const navigate = useNavigate();
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const defaultTheme = {
    primary: "#9b87f5",
    secondary: "#1A1F2C"
  };

  const currentTheme = profile?.custom_theme 
    ? (typeof profile.custom_theme === 'object' && profile.custom_theme !== null
        ? {
            primary: (profile.custom_theme as CustomTheme).primary || defaultTheme.primary,
            secondary: (profile.custom_theme as CustomTheme).secondary || defaultTheme.secondary
          }
        : defaultTheme)
    : defaultTheme;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-8 pb-40">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/profile')}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Profile Settings</h1>
              <p className="text-muted-foreground">
                Manage your account settings and preferences
              </p>
            </div>
          </div>
        </div>
        <Separator />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <UserCog className="w-5 h-5 text-purple-500" />
              <h2 className="text-xl font-semibold">Basic Information</h2>
            </div>
            <ProfileEditForm />
          </Card>

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

        {/* Right Column */}
        <div className="space-y-6">
          {profile && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Paintbrush className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-semibold">Theme Customization</h2>
              </div>
              <ThemeSelector 
                userId={profile.id} 
                currentTheme={currentTheme}
              />
            </Card>
          )}

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-purple-500" />
              <h2 className="text-xl font-semibold">Privacy & Security</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Manage your account security and privacy settings
            </p>
            <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Shield className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">Coming soon</p>
            </div>
          </Card>
        </div>
      </div>

      <GameBoyControls />
    </div>
  );
};

export default EditProfile;
