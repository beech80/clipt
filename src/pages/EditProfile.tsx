import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { ThemeSelector } from "@/components/profile/ThemeSelector";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserCog, Paintbrush, Shield, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ThemeColors {
  primary: string;
  secondary: string;
}

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

  const defaultTheme: ThemeColors = {
    primary: "#1EAEDB",
    secondary: "#000000"
  };

  const currentTheme: ThemeColors = profile?.custom_theme 
    ? (typeof profile.custom_theme === 'object' && profile.custom_theme !== null
        ? {
            primary: (profile.custom_theme as any).primary || defaultTheme.primary,
            secondary: (profile.custom_theme as any).secondary || defaultTheme.secondary
          }
        : defaultTheme)
    : defaultTheme;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/profile')}>
            Back to Profile
          </Button>
        </div>
        <Separator />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserCog className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Basic Information</h2>
            </div>
            <ProfileEditForm />
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Notification Preferences</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Configure how you receive notifications and updates
            </p>
            {/* Notification settings will be implemented later */}
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              Coming soon
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {profile && (
            <ThemeSelector 
              userId={profile.id} 
              currentTheme={currentTheme}
            />
          )}

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Privacy & Security</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Manage your account security and privacy settings
            </p>
            {/* Privacy settings will be implemented later */}
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              Coming soon
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;