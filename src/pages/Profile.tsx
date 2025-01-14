import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Gamepad2, Bookmark, Users2, Settings, Edit } from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);

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
              <div className="flex gap-4 mt-2">
                <span className="text-sm">{userStats.followers} Followers</span>
                <span className="text-sm">{userStats.following} Following</span>
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

        <Tabs defaultValue="games" className="w-full">
          <TabsList className="grid w-full grid-cols-4 gap-4">
            <TabsTrigger value="games">
              <Gamepad2 className="w-4 h-4 mr-2" /> Games
            </TabsTrigger>
            <TabsTrigger value="achievements">
              <Trophy className="w-4 h-4 mr-2" /> Achievements
            </TabsTrigger>
            <TabsTrigger value="saved">
              <Bookmark className="w-4 h-4 mr-2" /> Saved
            </TabsTrigger>
            <TabsTrigger value="friends">
              <Users2 className="w-4 h-4 mr-2" /> Friends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="games" className="space-y-4">
            {userGames.map(game => (
              <div key={game.id} className="flex items-center justify-between p-4 gaming-card hover:border-gaming-500">
                <div>
                  <h3 className="font-semibold">{game.name}</h3>
                  <p className="text-sm text-muted-foreground">Last played {game.lastPlayed}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{game.hours} hours</p>
                  <Button variant="outline" size="sm">Play Now</Button>
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

          <TabsContent value="friends" className="text-center py-8">
            <Users2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Connect with Gamers</h3>
            <p className="text-muted-foreground">Find and add friends to play together</p>
            <Button className="gaming-button mt-4">Find Friends</Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;