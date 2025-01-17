import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { ThemeSelector } from "@/components/profile/ThemeSelector";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

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
            currentTheme={profile.custom_theme || { primary: "#1EAEDB", secondary: "#000000" }} 
          />
        )}
      </div>
    </div>
  );
};

export default EditProfile;