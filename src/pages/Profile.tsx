import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Gamepad2, Trophy, MessageSquare, UserPlus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostItem from "@/components/PostItem";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'clips' | 'games' | 'achievements'>('clips');

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

  const handleAddFriend = () => {
    toast.success("Friend request sent!");
  };

  const handleMessage = () => {
    navigate('/messages');
  };

  return (
    <div className="space-y-6">
      <div className="gaming-card relative overflow-hidden backdrop-blur-md bg-[#1A1F2C]/80">
        <div className="absolute inset-0 bg-gradient-to-br from-gaming-700/20 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&h=200&fit=crop"
                alt="Profile"
                className="w-24 h-24 rounded-none border-4 border-gaming-500 mb-4 transition-all duration-300 hover:scale-105 animate-glow"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gaming-500/20 to-transparent pointer-events-none" />
            </div>
            <div className="text-center">
              <h1 className="clip-button text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gaming-400 to-gaming-600 truncate max-w-[200px]">
                ProGamer123
              </h1>
              <p className="text-sm text-gaming-400/80 mt-2 max-w-md px-4">
                Pro gamer and content creator. Love streaming and making awesome gaming content!
              </p>
              <div className="flex justify-center gap-4 mt-2">
                <span className="text-sm text-gaming-400">{userStats.followers} Followers</span>
                <span className="text-sm text-gaming-400">{userStats.following} Following</span>
              </div>
              <div className="flex justify-center gap-2 mt-4">
                <Button 
                  onClick={handleAddFriend}
                  className="gaming-button hover:animate-glow"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Friend
                </Button>
                <Button 
                  onClick={handleMessage}
                  className="gaming-button hover:animate-glow"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
                <Button
                  onClick={() => navigate('/profile/edit')}
                  className="gaming-button hover:animate-glow"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 mb-6">
            <Toggle
              pressed={activeTab === 'clips'}
              onPressedChange={() => setActiveTab('clips')}
              className="gaming-button flex gap-2 data-[state=on]:border-gaming-500 data-[state=on]:bg-gaming-500/20 hover:animate-glow"
            >
              <Gamepad2 className="w-4 h-4" /> Clips
            </Toggle>
            <Toggle
              pressed={activeTab === 'games'}
              onPressedChange={() => setActiveTab('games')}
              className="gaming-button flex gap-2 data-[state=on]:border-gaming-500 data-[state=on]:bg-gaming-500/20 hover:animate-glow"
            >
              <Gamepad2 className="w-4 h-4" /> Games
            </Toggle>
            <Toggle
              pressed={activeTab === 'achievements'}
              onPressedChange={() => setActiveTab('achievements')}
              className="gaming-button flex gap-2 data-[state=on]:border-gaming-500 data-[state=on]:bg-gaming-500/20 hover:animate-glow"
            >
              <Trophy className="w-4 h-4" /> Achievements
            </Toggle>
          </div>

          {activeTab === 'clips' && (
            <div className="space-y-4">
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
            </div>
          )}

          {activeTab === 'games' && (
            <div className="space-y-4">
              {userGames.map(game => (
                <div key={game.id} className="gaming-card hover:border-gaming-500 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold gaming-gradient">{game.name}</h3>
                      <p className="text-sm text-muted-foreground">Last played {game.lastPlayed}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{game.hours} hours</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-4">
              {achievements.map(achievement => (
                <div key={achievement.id} className="gaming-card hover:border-gaming-500 transition-all">
                  <div className="flex items-center gap-4">
                    <Trophy className="w-8 h-8 text-gaming-400" />
                    <div>
                      <h3 className="font-semibold gaming-gradient">{achievement.name}</h3>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      <p className="text-xs text-muted-foreground">Achieved on {achievement.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
