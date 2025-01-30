import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { 
  Gamepad2, 
  Trophy, 
  MessageSquare, 
  UserPlus, 
  Pencil, 
  ArrowLeft, 
  Bookmark,
  Users,
  Twitch,
  Youtube,
  Twitter
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostItem from "@/components/PostItem";
import { useNavigate, useParams } from "react-router-dom";
import { AchievementList } from "@/components/achievements/AchievementList";
import GameBoyControls from "@/components/GameBoyControls";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";

interface SocialLinks {
  twitter?: string;
  youtube?: string;
  twitch?: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'clips' | 'games' | 'achievements' | 'collections'>('clips');

  const isOwnProfile = !userId || userId === user?.id;

  const { data: profile } = useQuery({
    queryKey: ['profile', userId || user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId || user?.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: userClips } = useQuery({
    queryKey: ['user-clips', userId || user?.id],
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
        .eq('user_id', userId || user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    }
  });

  const handleAddFriend = async () => {
    try {
      const { error } = await supabase
        .from('follows')
        .insert([
          { follower_id: user?.id, following_id: userId }
        ]);
      
      if (error) throw error;
      toast.success("Friend request sent!");
    } catch (error) {
      toast.error("Failed to send friend request");
      console.error(error);
    }
  };

  const handleMessage = () => {
    navigate('/messages', { state: { recipientId: userId } });
  };

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

  const socialLinks = profile?.social_links as SocialLinks;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 pb-40">
      <Card className="bg-gradient-to-br from-gaming-900 to-gaming-800 border-none text-white overflow-hidden">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-600/20 to-gaming-900/90" />
          <div className="p-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-75 group-hover:opacity-100 transition duration-200 animate-tilt blur" />
                <img
                  src={profile?.avatar_url || "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&h=200&fit=crop"}
                  alt="Profile"
                  className="relative w-32 h-32 rounded-full border-4 border-purple-500 shadow-lg hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-2 border-white" />
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                  {profile?.display_name || "Loading..."}
                </h1>
                <p className="text-gray-300 mt-2 max-w-md">
                  {profile?.bio_description || "Pro gamer and content creator"}
                </p>
                
                <div className="flex flex-wrap justify-center sm:justify-start gap-6 mt-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-400">{userStats.followers}</div>
                    <div className="text-sm text-gray-400">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-400">{userStats.following}</div>
                    <div className="text-sm text-gray-400">Following</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-400">{userStats.achievements}</div>
                    <div className="text-sm text-gray-400">Achievements</div>
                  </div>
                </div>

                {socialLinks && (
                  <div className="flex gap-4 mt-4 justify-center sm:justify-start">
                    {socialLinks.twitter && (
                      <a href={`https://twitter.com/${socialLinks.twitter}`} target="_blank" rel="noopener noreferrer">
                        <Twitter className="w-5 h-5 text-gray-400 hover:text-purple-400 transition-colors" />
                      </a>
                    )}
                    {socialLinks.youtube && (
                      <a href={`https://youtube.com/${socialLinks.youtube}`} target="_blank" rel="noopener noreferrer">
                        <Youtube className="w-5 h-5 text-gray-400 hover:text-purple-400 transition-colors" />
                      </a>
                    )}
                    {socialLinks.twitch && (
                      <a href={`https://twitch.tv/${socialLinks.twitch}`} target="_blank" rel="noopener noreferrer">
                        <Twitch className="w-5 h-5 text-gray-400 hover:text-purple-400 transition-colors" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {!isOwnProfile && (
              <div className="flex flex-wrap justify-center sm:justify-end gap-3 mt-6">
                <Button 
                  onClick={() => navigate('/progress')}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  size="sm"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  View Progress
                </Button>
                <Button 
                  onClick={handleAddFriend}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  size="sm"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Friend
                </Button>
                <Button 
                  onClick={handleMessage}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  size="sm"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </div>
            )}

            {isOwnProfile && (
              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => navigate('/profile/edit')}
                  variant="outline"
                  size="sm"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="flex justify-center gap-4 mb-6">
        <Toggle
          pressed={activeTab === 'clips'}
          onPressedChange={() => setActiveTab('clips')}
          className="data-[state=on]:bg-purple-600 data-[state=on]:text-white"
        >
          <Gamepad2 className="w-4 h-4 mr-2" /> Clips
        </Toggle>
        <Toggle
          pressed={activeTab === 'games'}
          onPressedChange={() => setActiveTab('games')}
          className="data-[state=on]:bg-purple-600 data-[state=on]:text-white"
        >
          <Gamepad2 className="w-4 h-4 mr-2" /> Games
        </Toggle>
        <Toggle
          pressed={activeTab === 'achievements'}
          onPressedChange={() => setActiveTab('achievements')}
          className="data-[state=on]:bg-purple-600 data-[state=on]:text-white"
        >
          <Trophy className="w-4 h-4 mr-2" /> Achievements
        </Toggle>
        <Toggle
          pressed={activeTab === 'collections'}
          onPressedChange={() => {
            setActiveTab('collections');
            navigate('/collections');
          }}
          className="data-[state=on]:bg-purple-600 data-[state=on]:text-white"
        >
          <Bookmark className="w-4 h-4 mr-2" /> Collections
        </Toggle>
      </div>

      <div className="mt-6">
        {activeTab === 'clips' && (
          <div className="space-y-4">
            {!userClips?.length ? (
              <Card className="p-12 text-center bg-gaming-800/50 border-gaming-700">
                <Gamepad2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold">No clips yet</h3>
                <p className="text-gray-500">Share your gaming moments!</p>
              </Card>
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
          <div className="grid gap-4">
            {userGames.map(game => (
              <Card key={game.id} className="p-4 hover:bg-gaming-800/50 transition-colors border-gaming-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{game.name}</h3>
                    <p className="text-sm text-gray-500">Last played {game.lastPlayed}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{game.hours} hours</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'achievements' && (
          <AchievementList userId={userId || user?.id || ""} />
        )}

        {activeTab === 'collections' && (
          <Card className="p-12 text-center bg-gaming-800/50 border-gaming-700">
            <Bookmark className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold">View your collections</h3>
            <p className="text-gray-500">Organize and manage your favorite content!</p>
          </Card>
        )}
      </div>
      
      <GameBoyControls />
    </div>
  );
};

export default Profile;