import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Gamepad2, Trophy, MessageSquare, UserPlus, Pencil, Bookmark, UserX, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useNavigate, useParams } from "react-router-dom";
import { AchievementList } from "@/components/achievements/AchievementList";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Profile as ProfileType } from "@/types/profile";
import { getFollowerCount, getFollowingCount, isFollowing, toggleFollow } from "@/services/followService";
import { achievementService } from "@/services/achievementService";

const Profile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'clips' | 'achievements' | 'collections'>('clips');
  const [userFollows, setUserFollows] = useState(false);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  
  // Stats with realistic initial values
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    achievements: 0
  });

  const { data: profile, isLoading: profileLoading } = useQuery<ProfileType | null>({
    queryKey: ['user-profile', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id || user?.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return {
        ...data,
        custom_theme: data.custom_theme || { primary: "#1EAEDB", secondary: "#000000" }
      } as ProfileType;
    }
  });

  // Fetch achievements count
  const { data: achievements } = useQuery({
    queryKey: ['user-achievements-count', id || user?.id],
    queryFn: async () => {
      if (!id && !user?.id) return [];
      return await achievementService.getUserAchievements(id || user?.id || '');
    },
    enabled: !!(id || user?.id)
  });

  const isOwnProfile = user && (!id || id === user?.id);
  
  // Fetch follow counts and status on profile load
  useEffect(() => {
    const fetchFollowData = async () => {
      if (!profile) return;
      
      const profileId = profile.id;
      try {
        // Get follower and following counts
        const followerCount = await getFollowerCount(profileId);
        const followingCount = await getFollowingCount(profileId);
        
        // Get achievements count from achievements data
        const achievementsCount = achievements ? 
          achievements.filter(a => a.completed).length : 0;
        
        // Update stats
        setStats({
          followers: followerCount,
          following: followingCount,
          achievements: achievementsCount
        });
        
        // Check if current user is following this profile
        if (user && !isOwnProfile) {
          const following = await isFollowing(user.id, profileId);
          setUserFollows(following);
        }
      } catch (error) {
        console.error("Error fetching follow data:", error);
      }
    };
    
    fetchFollowData();
  }, [profile, user, isOwnProfile, achievements]);

  const handleToggleFollow = async () => {
    if (!user) {
      toast.error("Please sign in to follow users");
      navigate('/login');
      return;
    }
    
    if (!profile || isOwnProfile) return;
    
    try {
      setLoading(true);
      const response = await toggleFollow(user.id, profile.id);
      
      if (response.error) {
        throw response.error;
      }
      
      // Update local state
      setUserFollows(!!response.followed);
      
      // Update follower count
      setStats(prev => ({
        ...prev,
        followers: prev.followers + (response.followed ? 1 : -1)
      }));
      
      toast.success(response.followed ? `Following ${profile.username || 'user'}` : `Unfollowed ${profile.username || 'user'}`);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['user-profile', profile.id] });
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("Failed to update follow status");
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = () => {
    if (!user) {
      toast.error("Please sign in to send messages");
      navigate('/login');
      return;
    }
    navigate('/messages');
  };

  const handleAchievementClick = () => {
    setActiveTab('achievements');
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <UserX className="w-16 h-16 text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-700">Profile Not Found</h1>
        <p className="text-gray-500">This user profile doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/')} variant="outline">
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="relative max-w-4xl mx-auto p-4 sm:p-6 space-y-6 pb-40">
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-none text-white">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <img
                src={profile?.avatar_url || "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&h=200&fit=crop"}
                alt="Profile"
                className="w-32 h-32 rounded-full border-4 border-purple-500 shadow-lg hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-2 border-white"></div>
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                {profile?.display_name || "Unknown User"}
              </h1>
              <p className="text-gray-300 mt-2 max-w-md">
                {profile?.bio || "This user hasn't added a bio yet."}
              </p>
              
              <div className="flex flex-wrap justify-center sm:justify-start gap-6 mt-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-400">{stats.followers}</div>
                  <div className="text-sm text-gray-400">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-400">{stats.following}</div>
                  <div className="text-sm text-gray-400">Following</div>
                </div>
                <Button
                  variant="ghost"
                  className="text-center"
                  onClick={handleAchievementClick}
                >
                  <div>
                    <div className="text-xl font-bold text-purple-400">{stats.achievements}</div>
                    <div className="text-sm text-gray-400">Achievements</div>
                  </div>
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center sm:justify-end gap-3 mt-6">
            {!isOwnProfile && (
              <>
                <Button 
                  onClick={handleToggleFollow}
                  className={`${userFollows ? 'bg-gray-600 hover:bg-gray-700' : 'bg-purple-600 hover:bg-purple-700'} text-white`}
                  size="sm"
                  disabled={loading}
                >
                  {userFollows ? (
                    <><UserMinus className="w-4 h-4 mr-2" />Unfollow</>
                  ) : (
                    <><UserPlus className="w-4 h-4 mr-2" />Follow</>
                  )}
                </Button>
                <Button 
                  onClick={handleMessage}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  size="sm"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </>
            )}
            {isOwnProfile && (
              <>
                <Button
                  onClick={() => navigate('/profile/edit')}
                  variant="outline"
                  size="sm"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      <div className="flex justify-center w-full overflow-x-auto scrollbar-none -mx-4 px-4">
        <div className="inline-flex flex-nowrap items-center gap-1.5 p-1.5 rounded-lg bg-black/20 backdrop-blur-sm border border-white/10">
          <Toggle
            pressed={activeTab === 'clips'}
            onPressedChange={() => setActiveTab('clips')}
            className={`w-10 h-10 transition-all ${activeTab === 'clips' ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-400 hover:bg-gray-700'}`}
          >
            <Gamepad2 className="w-5 h-5" />
          </Toggle>
          <Toggle
            pressed={activeTab === 'achievements'}
            onPressedChange={() => setActiveTab('achievements')}
            className={`w-10 h-10 transition-all ${activeTab === 'achievements' ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-400 hover:bg-gray-700'}`}
          >
            <Trophy className="w-5 h-5" />
          </Toggle>
          <Toggle
            pressed={activeTab === 'collections'}
            onPressedChange={() => setActiveTab('collections')}
            className={`w-10 h-10 transition-all ${activeTab === 'collections' ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-400 hover:bg-gray-700'}`}
          >
            <Bookmark className="w-5 h-5" />
          </Toggle>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'clips' && (
          <div className="space-y-4">
            <Card className="p-12 text-center">
              <Gamepad2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold">No clips yet</h3>
              <p className="text-gray-500">Share your gaming moments!</p>
            </Card>
          </div>
        )}

        {activeTab === 'achievements' && (
          <AchievementList userId={id || user?.id || ''} />
        )}

        {activeTab === 'collections' && (
          <Card className="p-12 text-center">
            <Bookmark className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold">View your collections</h3>
            <p className="text-gray-500">Organize and manage your favorite content!</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Profile;
