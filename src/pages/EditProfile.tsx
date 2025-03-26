import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Profile } from "@/types/profile";
import { useEffect } from "react";

const EditProfile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Force refetch on component mount
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['profile'] });
  }, [queryClient]);
  
  const { data: profile, isLoading, error, refetch } = useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      
      console.log('Profile data loaded:', data);
      
      return {
        ...data,
        custom_theme: data.custom_theme || { primary: "#1EAEDB", secondary: "#000000" }
      } as Profile;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Handle errors
  if (error) {
    console.error('Profile query error:', error);
    toast.error('Failed to load profile. Please try again.');
  }

  const userId = profile?.id;

  return (
    <div className="container max-w-2xl mx-auto p-4 pb-40">
      <div className="mb-6 flex items-center">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/profile')}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Edit Profile</h1>
      </div>

      <div className="bg-card p-6 rounded-lg border">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <ProfileEditForm userId={userId} />
        )}
      </div>
    </div>
  );
};

export default EditProfile;
