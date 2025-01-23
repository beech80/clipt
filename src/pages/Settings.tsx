import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MainNav } from "@/components/MainNav";
import { StreamSettings } from "@/components/streaming/StreamSettings";
import { StreamControls } from "@/components/streaming/StreamControls";
import { TwoFactorSettings } from "@/components/settings/TwoFactorSettings";
import { DataPrivacySettings } from "@/components/settings/DataPrivacySettings";

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    getProfile();
  }, [user, navigate]);

  const getProfile = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) {
        throw error;
      }

      setProfile(data);
    } catch (error) {
      toast.error("Error loading profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (updates: any) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user?.id);

      if (error) throw error;
      toast.success("Profile updated successfully!");
      getProfile();
    } catch (error) {
      toast.error("Error updating profile");
    }
  };

  const handleStreamUpdate = (data: { 
    isLive: boolean; 
    streamKey: string | null; 
    streamUrl: string | null 
  }) => {
    if (data.isLive) {
      toast.success("Stream started successfully!");
    } else {
      toast.success("Stream ended successfully!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gaming-900 to-gaming-800">
        <MainNav />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-gaming-100">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gaming-900 to-gaming-800">
      <MainNav />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gaming-100">Settings</h1>
          </div>

          <div className="grid gap-8">
            <Card className="p-6 bg-gaming-800/50 backdrop-blur-sm border border-gaming-700/50">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gaming-100">Profile Settings</h2>
              </div>
              {profile && (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    <Button 
                      onClick={() => navigate("/edit-profile")}
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      Edit Profile
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-6 bg-gaming-800/50 backdrop-blur-sm border border-gaming-700/50">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gaming-100">Streaming Settings</h2>
              </div>
              {user && <StreamSettings userId={user.id} />}
              {user && <StreamControls 
                userId={user.id} 
                onStreamUpdate={handleStreamUpdate}
              />}
            </Card>

            <Card className="p-6 bg-gaming-800/50 backdrop-blur-sm border border-gaming-700/50">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gaming-100">Security Settings</h2>
              </div>
              {user && <TwoFactorSettings />}
            </Card>

            <Card className="p-6 bg-gaming-800/50 backdrop-blur-sm border border-gaming-700/50">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gaming-100">Privacy Settings</h2>
              </div>
              {user && <DataPrivacySettings />}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}