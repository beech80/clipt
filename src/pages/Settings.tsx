
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Profile, CustomTheme } from "@/types/profile";
import { ThemeSelector } from "@/components/profile/ThemeSelector";
import GameBoyControls from "@/components/GameBoyControls";
import { LogOut, ArrowLeft, Paintbrush } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const { user, signOut } = useAuth();
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

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-8 pb-40">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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
              Customize your app experience
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Theme Settings */}
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

        {/* Sign Out Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Account</h2>
          <Button 
            variant="destructive" 
            onClick={handleSignOut}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </Card>
      </div>

      <GameBoyControls />
    </div>
  );
};

export default Settings;
