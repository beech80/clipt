import React from 'react';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Gamepad2, Trophy, MessageSquare, UserPlus, Pencil, Bookmark, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostItem from "@/components/PostItem";
import { AchievementList } from "@/components/achievements/AchievementList";
import GameBoyControls from "@/components/GameBoyControls";
import { Card } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = React.useState<'clips' | 'games' | 'achievements' | 'collections'>('clips');

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const { data: userClips, isLoading: clipsLoading } = useQuery({
    queryKey: ['user-clips', user?.id],
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
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const userStats = {
    followers: 1234,
    following: 567,
    gamesPlayed: 89,
    achievements: 45
  };

  const handleAddFriend = () => {
    toast.success("Friend request sent!");
  };

  const handleMessage = () => {
    navigate('/messages');
  };

  if (profileLoading || clipsLoading) {
    return (
      <div className="min-h-screen bg-[#1A1F2C] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gaming-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1F2C]">
      <div className="gameboy-header">
        <span className="gameboy-title">PROFILE</span>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 pb-40 mt-16">
        <Card className="gaming-card bg-gradient-to-br from-gaming-900 to-gaming-800">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <img
                  src={profile?.avatar_url || "/placeholder.svg"}
                  alt="Profile"
                  className="w-32 h-32 rounded-full border-4 border-gaming-400 shadow-lg hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-2 border-white"></div>
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl font-bold gaming-gradient">
                  {profile?.display_name || "Loading..."}
                </h1>
                <p className="text-gray-300 mt-2 max-w-md">
                  {profile?.bio_description || "Pro gamer and content creator"}
                </p>
                
                <div className="flex flex-wrap justify-center sm:justify-start gap-6 mt-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gaming-400">{userStats.followers}</div>
                    <div className="text-sm text-gray-400">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gaming-400">{userStats.following}</div>
                    <div className="text-sm text-gray-400">Following</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gaming-400">{userStats.achievements}</div>
                    <div className="text-sm text-gray-400">Achievements</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center sm:justify-end gap-3 mt-6">
              <Button 
                onClick={() => navigate('/progress')}
                className="gaming-button"
                size="sm"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Progress
              </Button>
              <Button 
                onClick={handleAddFriend}
                className="gaming-button"
                size="sm"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Friend
              </Button>
              <Button 
                onClick={handleMessage}
                className="gaming-button"
                size="sm"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Message
              </Button>
              <Button
                onClick={() => navigate('/profile/edit')}
                variant="outline"
                size="sm"
                className="gaming-button"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
        </Card>

        <div className="flex justify-center gap-4 mb-6">
          <Toggle
            pressed={activeTab === 'clips'}
            onPressedChange={() => setActiveTab('clips')}
            className="gaming-button"
          >
            <Gamepad2 className="w-4 h-4 mr-2" /> Clips
          </Toggle>
          <Toggle
            pressed={activeTab === 'achievements'}
            onPressedChange={() => setActiveTab('achievements')}
            className="gaming-button"
          >
            <Trophy className="w-4 h-4 mr-2" /> Achievements
          </Toggle>
          <Toggle
            pressed={activeTab === 'collections'}
            onPressedChange={() => setActiveTab('collections')}
            className="gaming-button"
          >
            <Bookmark className="w-4 h-4 mr-2" /> Collections
          </Toggle>
        </div>

        <div className="mt-6">
          {activeTab === 'clips' && (
            <div className="space-y-4">
              {!userClips?.length ? (
                <Card className="gaming-card p-12 text-center">
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

          {activeTab === 'achievements' && (
            <AchievementList userId={user?.id || ''} />
          )}

          {activeTab === 'collections' && (
            <Card className="gaming-card p-12 text-center">
              <Bookmark className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold">View your collections</h3>
              <p className="text-gray-500">Organize and manage your favorite content!</p>
            </Card>
          )}
        </div>
      </div>
      
      <GameBoyControls />
    </div>
  );
};

export default Profile;