import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserCog, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Profile } from "@/types/profile";
import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
            <Tabs defaultValue="account">
              <TabsList className="mb-4 dark:bg-slate-800">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>
              <TabsContent value="account">
                <ProfileEditForm userId={userId} />
              </TabsContent>
              <TabsContent value="preferences">
                <div className="space-y-4">
                  {/* Theme customization temporarily removed - will be added back in future update */}
                  <div className="rounded-md border dark:border-slate-800 p-4">
                    <h3 className="text-lg font-medium mb-2">Preferences</h3>
                    <p className="text-muted-foreground">Configure your app preferences here. Theme customization is coming soon!</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
