import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Gamepad2, Trophy, MessageSquare, UserPlus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostItem from "@/components/PostItem";
import { useNavigate } from "react-router-dom";
import { AchievementList } from "@/components/achievements/AchievementList";
import GameBoyControls from "@/components/GameBoyControls";

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

  const handleAddFriend = () => {
    toast.success("Friend request sent!");
  };

  const handleMessage = () => {
    navigate('/messages');
  };

  return (
    <div className="space-y-6 pb-40">
      <div className="gaming-card">
        <div className="flex flex-col items-center mb-6">
          <img
            src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&h=200&fit=crop"
            alt="Profile"
            className="w-24 h-24 rounded-full border-4 border-gaming-500 animate-glow mb-4"
          />
          <div className="text-center">
            <h1 className="text-2xl font-bold gaming-gradient">Cliped</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Pro gamer and content creator. Love streaming and making awesome gaming content!
            </p>
            <div className="flex justify-center gap-4 mt-2">
              <span className="text-sm">{userStats.followers} Followers</span>
              <span className="text-sm">{userStats.following} Following</span>
            </div>
            <div className="flex justify-center gap-2 mt-4">
              <Button 
                onClick={handleAddFriend}
                className="gaming-button"
              >
                <UserPlus className="w-4 h-4" />
                Add Friend
              </Button>
              <Button 
                onClick={handleMessage}
                className="gaming-button"
              >
                <MessageSquare className="w-4 h-4" />
                Message
              </Button>
              <Button
                onClick={() => navigate('/profile/edit')}
                className="gaming-button"
              >
                <Pencil className="w-4 h-4" />
                Edit Profile
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4 mb-6">
          <Toggle
            pressed={activeTab === 'clips'}
            onPressedChange={() => setActiveTab('clips')}
            className="gaming-button flex gap-2 data-[state=on]:border-gaming-500 data-[state=on]:bg-gaming-500/20"
          >
            <Gamepad2 className="w-4 h-4" /> Clips
          </Toggle>
          <Toggle
            pressed={activeTab === 'games'}
            onPressedChange={() => setActiveTab('games')}
            className="gaming-button flex gap-2 data-[state=on]:border-gaming-500 data-[state=on]:bg-gaming-500/20"
          >
            <Gamepad2 className="w-4 h-4" /> Games
          </Toggle>
          <Toggle
            pressed={activeTab === 'achievements'}
            onPressedChange={() => setActiveTab('achievements')}
            className="gaming-button flex gap-2 data-[state=on]:border-gaming-500 data-[state=on]:bg-gaming-500/20"
          >
            <Trophy className="w-4 h-4" /> Achievements
          </Toggle>
        </div>

        <div className="mt-6">
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
            <AchievementList userId="123" />
          )}
        </div>
      </div>
      <GameBoyControls />
    </div>
  );
};

export default Profile;