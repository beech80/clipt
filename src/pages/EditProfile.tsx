
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { ThemeSelector } from "@/components/profile/ThemeSelector";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserCog, Paintbrush, Shield, Bell, ArrowLeft, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import GameBoyControls from "@/components/GameBoyControls";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

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

  const { data: userGames } = useQuery({
    queryKey: ['user-games'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_games')
        .select(`
          *,
          game_categories (name, id)
        `)
        .order('last_played', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const { data: availableGames } = useQuery({
    queryKey: ['available-games'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  const handleAddGame = async (gameId: string) => {
    try {
      const { error } = await supabase
        .from('user_games')
        .insert({
          game_id: gameId,
          user_id: profile?.id
        });

      if (error) throw error;
      toast.success("Game added to your profile!");
    } catch (error) {
      toast.error("Failed to add game");
      console.error(error);
    }
  };

  const handleRemoveGame = async (gameId: string) => {
    try {
      const { error } = await supabase
        .from('user_games')
        .delete()
        .eq('game_id', gameId)
        .eq('user_id', profile?.id);

      if (error) throw error;
      toast.success("Game removed from your profile");
    } catch (error) {
      toast.error("Failed to remove game");
      console.error(error);
    }
  };

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
            <div className="flex items-center gap-2 mb-6">
              <Gamepad2 className="w-5 h-5 text-purple-500" />
              <h2 className="text-xl font-semibold">Games You Play</h2>
            </div>
            
            <div className="space-y-4">
              <Select onValueChange={handleAddGame}>
                <SelectTrigger>
                  <SelectValue placeholder="Add a game..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Available Games</SelectLabel>
                    {availableGames?.map((game) => (
                      <SelectItem key={game.id} value={game.id}>
                        {game.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <div className="space-y-2">
                {userGames?.map((userGame) => (
                  <div key={userGame.id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <span>{userGame.game_categories.name}</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleRemoveGame(userGame.game_id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
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

      <GameBoyControls />
    </div>
  );
};

export default EditProfile;
