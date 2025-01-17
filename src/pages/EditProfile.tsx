import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { ThemeSelector } from "@/components/profile/ThemeSelector";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface ThemeColors {
  primary: string;
  secondary: string;
}

const EditProfile = () => {
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
    <div className="max-w-2xl mx-auto p-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Edit Profile</h1>
          <p className="text-muted-foreground">
            Update your profile information and preferences.
          </p>
        </div>

        <ProfileEditForm />

        {profile && (
          <ThemeSelector 
            userId={profile.id} 
            currentTheme={currentTheme}
          />
        )}
      </div>
    </div>
  );
};

export default EditProfile;