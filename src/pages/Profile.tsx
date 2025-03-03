import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Gamepad2, Trophy, MessageSquare, UserPlus, Pencil, Bookmark, UserX, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useParams } from "react-router-dom";
import AchievementList from "@/components/achievements/AchievementList";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Profile as ProfileType } from "@/types/profile";
import { followUser } from "@/lib/follow-helper";
import styled from "styled-components";

/**
 * Profile page component - displays user profile details and allows following/unfollowing
 */
const ProfileContent = styled.div`
  max-height: none; /* Remove any height restrictions */
  overflow-y: visible; /* Allow content to be visible */
  padding-bottom: 80px; /* Add padding at bottom for better scrolling */
  
  /* Apply CSS to ensure scrolling works */
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
`;

const Profile = () => {
  // Component state
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'clips' | 'achievements'>('clips');
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userFollows, setUserFollows] = useState(false);
  
  // Stats for displaying counts
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    achievements: 0
  });

  // Safe profile ID handling
  const profileId = id || user?.id;
  const isOwnProfile = user?.id === profileId;

  /**
   * Handle follow/unfollow action
   */
  const handleFollow = useCallback(async () => {
    if (!profileId || !user) return;
    
    try {
      setLoading(true);
      const result = await followUser(profileId);
      
      // Update state based on follow result
      setUserFollows(result);
      
      // Update follower count optimistically
      setStats(prev => ({
        ...prev,
        followers: result ? prev.followers + 1 : Math.max(0, prev.followers - 1)
      }));
      
    } catch (error) {
      console.error("Error following user:", error);
      toast.error("Failed to update follow status");
    } finally {
      setLoading(false);
    }
  }, [profileId, user]);

  /**
   * Fetch the user's profile data
   */
  const fetchProfileData = useCallback(async () => {
    if (!profileId) {
      setError("No profile ID provided");
      setLoading(false);
      return;
    }

    try {
      console.log(`Profile: Fetching profile data for: ${profileId}`);
      
      // First try to ensure the profile exists
      const { ensureProfileExists } = await import('@/lib/follow-helper');
      const profileCreated = await ensureProfileExists(profileId);
      
      if (!profileCreated) {
        console.log("ensureProfileExists failed, falling back to direct query");
      }
      
      // Query for profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle();
        
      if (profileError) {
        console.error("Error fetching profile:", profileError);
        setError("Could not load profile data");
        setLoading(false);
        return;
      }
      
      if (!profileData) {
        console.log("No profile found, creating fallback profile");
        
        // Simple creation of fallback profile if missing
        try {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: profileId,
              username: `user_${profileId.substring(0, 8)}`,
              display_name: `User ${profileId.substring(0, 8)}`,
              followers: 0,
              following: 0,
              achievements: 0,
              created_at: new Date().toISOString()
            })
            .select()
            .single();
            
          if (createError || !newProfile) {
            setError("Could not create profile");
            setLoading(false);
            return;
          }
          
          setProfile(newProfile);
          setStats({
            followers: 0,
            following: 0,
            achievements: 0
          });
          
        } catch (createError) {
          console.error("Error creating profile:", createError);
          setError("Could not create profile");
        }
        
        setLoading(false);
        return;
      }
      
      // Process the profile data
      console.log("Profile data loaded successfully:", profileData);
      setProfile(profileData);
      
      // Set default stats
      setStats({
        followers: profileData.followers || 0,
        following: profileData.following || 0,
        achievements: profileData.achievements || 0
      });
      
      // Check if the current user follows this profile
      if (user && user.id !== profileId) {
        const { data: followData } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', user.id)
          .eq('following_id', profileId)
          .maybeSingle();
          
        setUserFollows(!!followData);
      }
      
    } catch (error) {
      console.error("Error in profile data fetch:", error);
      setError("An error occurred while loading profile");
    } finally {
      setLoading(false);
    }
  }, [profileId, user]);

  // Load profile data when component mounts or profile ID changes
  useEffect(() => {
    console.log("Profile component initial load for ID:", profileId);
    setLoading(true);
    setError(null);
    
    // No timeout - let the user wait as long as needed
    
    fetchProfileData().catch(err => {
      console.error("Fetch profile error:", err);
      setError("Failed to load profile data");
      setLoading(false);
    });
    
    // No cleanup for timeout since we're not using one
  }, [profileId]); // Only depend on profileId, not fetchProfileData

  // Render loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="gaming-card p-8 w-full max-w-md">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-gaming-800 animate-pulse"></div>
            <div className="w-40 h-6 bg-gaming-800 animate-pulse rounded"></div>
            <div className="w-full h-4 bg-gaming-800 animate-pulse rounded"></div>
            <div className="w-full h-4 bg-gaming-800 animate-pulse rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="gaming-card p-8 w-full max-w-md text-center">
          <UserX className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Profile Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button onClick={() => window.location.href = '/'}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  // Render empty state if no profile
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="gaming-card p-8 w-full max-w-md text-center">
          <UserX className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Profile Not Found</h2>
          <p className="text-gray-400 mb-4">This profile doesn't exist or has been removed.</p>
          <Button onClick={() => window.location.href = '/'}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  // Main profile content
  return (
    <ProfileContent>
      {/* Profile Header */}
      <div className="gaming-card p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gaming-800 overflow-hidden border-4 border-gaming-500">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.username || 'User'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gaming-700 text-4xl font-bold text-gaming-300">
                  {(profile.username?.[0] || profile.display_name?.[0] || 'U').toUpperCase()}
                </div>
              )}
            </div>
          </div>
          
          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row gap-4 items-center md:items-start justify-between">
              <div className="text-center md:text-left">
                <h1 className="text-2xl font-bold text-gaming-200 mb-1">
                  {profile.display_name || profile.username || 'User'}
                </h1>
                <p className="text-gaming-400 mb-2">@{profile.username || 'username'}</p>
                <p className="text-gaming-300 max-w-md mb-4">{profile.bio || 'No bio provided'}</p>
              </div>
              
              <div className="flex gap-2">
                {isOwnProfile ? (
                  <Button 
                    onClick={() => window.location.href = '/profile/edit'} 
                    variant="outline" 
                    className="flex items-center gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={handleFollow} 
                      variant={userFollows ? "outline" : "default"}
                      className="flex items-center gap-2"
                      disabled={loading}
                    >
                      {userFollows ? (
                        <>
                          <UserMinus className="w-4 h-4" />
                          <span>Unfollow</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span>Follow</span>
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => window.location.href = `/messages/${profileId}`}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Message</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex justify-center md:justify-start gap-6 mt-4">
              <div className="text-center">
                <p className="text-gaming-200 font-bold">{stats.followers}</p>
                <p className="text-gaming-400 text-sm">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-gaming-200 font-bold">{stats.following}</p>
                <p className="text-gaming-400 text-sm">Following</p>
              </div>
              <div className="text-center">
                <p className="text-gaming-200 font-bold">{stats.achievements}</p>
                <p className="text-gaming-400 text-sm">Achievements</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex justify-center mb-6">
        <div className="gaming-card p-2">
          <div className="flex gap-2">
            <Toggle
              pressed={activeTab === 'clips'}
              onPressedChange={() => setActiveTab('clips')}
              variant="outline"
              className="flex gap-2 items-center"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Clips</span>
            </Toggle>
            <Toggle
              pressed={activeTab === 'achievements'}
              onPressedChange={() => setActiveTab('achievements')}
              variant="outline"
              className="flex gap-2 items-center"
            >
              <Trophy className="w-4 h-4" />
              <span>Achievements</span>
            </Toggle>
          </div>
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'clips' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="gaming-card p-8 flex flex-col items-center justify-center text-center h-60">
            <Gamepad2 className="w-12 h-12 text-gaming-400 mb-4" />
            <h3 className="text-xl font-semibold text-gaming-200 mb-2">No Clips Yet</h3>
            <p className="text-gaming-400">User hasn't posted any gaming clips</p>
          </Card>
        </div>
      ) : (
        <div className="gaming-card p-6">
          <AchievementList userId={profileId} />
        </div>
      )}
    </ProfileContent>
  );
};

export default Profile;
