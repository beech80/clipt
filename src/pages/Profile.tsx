import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Gamepad2, Bookmark, Settings, Edit, MessageSquare, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostItem from "@/components/PostItem";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);

  const { data: userClips } = useQuery({
    queryKey: ['user-clips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          ),
          likes:likes (
            count
          ),
          clip_votes:clip_votes (
            count
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    }
  });

  const userStats = {
    followers: 1234,
    following: 567,
    gamesPlayed: 89,
    achievements: 45
  };

  const userGames = [
    { id: 1, name: "Fortnite", hours: 156, lastPlayed: "2 days ago" },
    { id: 2, name: "Minecraft", hours: 89, lastPlayed: "1 week ago" },
    { id: 3, name: "Call of Duty", hours: 234, lastPlayed: "3 days ago" }
  ];

  const achievements = [
    { id: 1, name: "First Victory", description: "Won your first game", date: "2024-01-15" },
    { id: 2, name: "Social Butterfly", description: "Made 100 friends", date: "2024-02-01" },
    { id: 3, name: "Stream Star", description: "Reached 1000 viewers", date: "2024-02-15" }
  ];

  const handleEditProfile = () => {
    setIsEditing(true);
    toast.info("Profile editing coming soon!");
  };

  const handleAddFriend = () => {
    toast.success("Friend request sent!");
  };

  const handleMessage = () => {
    toast.success("Message feature coming soon!");
  };

  return (
    <div className="space-y-6">
      <div className="gaming-card">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <img
              src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&h=200&fit=crop"
              alt="Profile"
              className="w-24 h-24 rounded-full border-4 border-gaming-500"
            />
            <div>
              <h1 className="text-2xl font-bold">ProGamer123</h1>
              <p className="text-muted-foreground">Joined January 2024</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                Pro gamer and content creator. Love streaming and making awesome gaming content!
              </p>
              <div className="flex gap-4 mt-2">
                <span className="text-sm">{userStats.followers} Followers</span>
                <span className="text-sm">{userStats.following} Following</span>
              </div>
              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={handleAddFriend}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Friend
                </Button>
                <Button 
                  onClick={handleMessage}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message
                </Button>
              </div>
            </div>
          </div>
          <Button 
            onClick={handleEditProfile} 
            variant="ghost" 
            size="icon" 
            className="hover:bg-gaming-500/20"
          >
            <Edit className="w-5 h-5" />
          </Button>
        </div>

        <Tabs defaultValue="clips" className="w-full">
          <TabsList className="grid w-full grid-cols-4 gap-4">
            <TabsTrigger value="clips">
              <Gamepad2 className="w-4 h-4 mr-2" /> Clips
            </TabsTrigger>
            <TabsTrigger value="games">
              <Gamepad2 className="w-4 h-4 mr-2" /> Games
            </TabsTrigger>
            <TabsTrigger value="achievements">
              <Trophy className="w-4 h-4 mr-2" /> Achievements
            </TabsTrigger>
            <TabsTrigger value="saved">
              <Bookmark className="w-4 h-4 mr-2" /> Saved
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clips" className="space-y-4">
            {userClips?.length === 0 ? (
              <div className="text-center py-8">
                <Gamepad2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No clips yet</h3>
                <p className="text-muted-foreground">Share your gaming moments!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {userClips?.map((clip) => (
                  <PostItem 
                    key={clip.id} 
                    post={{
                      ...clip,
                      likes_count: clip.likes?.[0]?.count || 0,
                      clip_votes: clip.clip_votes || []
                    }} 
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="games" className="space-y-4">
            {userGames.map(game => (
              <div key={game.id} className="flex items-center justify-between p-4 gaming-card hover:border-gaming-500">
                <div>
                  <h3 className="font-semibold">{game.name}</h3>
                  <p className="text-sm text-muted-foreground">Last played {game.lastPlayed}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{game.hours} hours</p>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            {achievements.map(achievement => (
              <div key={achievement.id} className="flex items-center gap-4 p-4 gaming-card hover:border-gaming-500">
                <Trophy className="w-8 h-8 text-gaming-400" />
                <div>
                  <h3 className="font-semibold">{achievement.name}</h3>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  <p className="text-xs text-muted-foreground">Achieved on {achievement.date}</p>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="saved" className="text-center py-8">
            <Bookmark className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No saved items yet</h3>
            <p className="text-muted-foreground">Items you save will appear here</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;