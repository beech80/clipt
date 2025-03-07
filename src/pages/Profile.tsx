import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Gamepad2, Trophy, MessageSquare, Settings, UserX } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useParams, useNavigate } from "react-router-dom";
import AchievementList from "@/components/achievements/AchievementList";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Profile as ProfileType } from "@/types/profile";
import styled from "styled-components";
import { UserLink } from '@/components/user/UserLink';
import PostItem from '@/components/PostItem';

/**
 * Profile page component - displays user profile details
 */
const ProfileContent = styled.div`
  max-height: none; /* Remove any height restrictions */
  overflow-y: visible; /* Allow content to be visible */
  padding-bottom: 250px; /* Add more padding at bottom for better scrolling */
  
  /* Apply CSS to ensure scrolling works */
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  
  /* Make sure content is fully visible */
  display: block;
  width: 100%;
`;

const Profile = () => {
  // Component state
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'clips' | 'achievements'>('clips');
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  
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
   * Fetch the user's profile data
   */
  const fetchProfileData = async (userId: string) => {
    try {
      // Try to get the profile by ID
      const { data: profile, error } = await supabase
        .from('profiles')
        .select()
        .eq('id', userId)
        .single();
      
      // If there's an error or no profile for current user, create one
      if (error || !profile) {
        if (userId === user?.id) {
          console.log("No profile found for current user, creating one");
          
          // Create a default profile for the current user
          const defaultProfile = {
            id: userId,
            username: `user_${userId.substring(0, 8)}`,
            display_name: user?.user_metadata?.name || 'New User',
            bio: 'Welcome to my Clipt profile!',
            avatar_url: user?.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + userId,
            created_at: new Date().toISOString(),
          };
          
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .upsert(defaultProfile)
            .select()
            .single();
          
          if (createError) {
            console.error("Error creating profile:", createError);
            throw new Error('Failed to create profile');
          }
          
          return newProfile;
        } else {
          // Profile doesn't exist and it's not the current user
          console.error("Profile not found for user:", userId);
          return null;
        }
      }
      
      return profile;
    } catch (error) {
      console.error("Error fetching profile:", error);
      
      // Return a fallback profile for UI display when fetch fails
      // This prevents the UI from showing errors to the user
      if (userId === user?.id) {
        return {
          id: userId,
          username: user?.email?.split('@')[0] || 'user',
          display_name: user?.user_metadata?.name || 'Your Profile',
          bio: 'Profile information temporarily unavailable',
          avatar_url: user?.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + userId,
          created_at: new Date().toISOString(),
        };
      }
      return null;
    }
  };

  // Load profile data when component mounts or profile ID changes
  useEffect(() => {
    if (!profileId) return;
    
    setLoading(true);
    setError(null);
    
    // Add a delay to ensure auth context is fully loaded
    const timer = setTimeout(() => {
      loadProfileData();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [profileId, user]);

  const loadProfileData = async () => {
    try {
      // Fetch profile data
      const profileData = await fetchProfileData(profileId);
      
      if (!profileData) {
        setError("Profile not found");
        setLoading(false);
        return;
      }
      
      setProfile(profileData);
      console.log("Successfully loaded profile:", profileData);
      
      // Always ensure we have stats, even if they're zeroed out
      setStats({
        followers: profileData.followers || 0,
        following: profileData.following || 0,
        achievements: profileData.achievements || 0
      });
      
      // Fetch user's posts for the clips tab
      try {
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            id,
            content,
            image_url,
            video_url,
            user_id,
            created_at,
            post_type,
            games (
              name,
              id
            ),
            likes_count:likes(count),
            comments_count:comments(count),
            clip_votes:clip_votes(count)
          `)
          .eq('user_id', profileId)
          .order('created_at', { ascending: false });
        
        if (postsError) {
          console.error("Error fetching posts:", postsError);
        } else {
          console.log("User posts loaded:", postsData);
          setUserPosts(postsData || []);
        }
      } catch (postError) {
        console.error("Error fetching user posts:", postError);
        // Continue execution even if posts fail to load
      }
      
      // Initialize default achievements for the new user if needed
      if (profileData.id === user?.id && (!profileData.achievements || profileData.achievements === 0)) {
        try {
          const { achievementService } = await import('@/services/achievementService');
          await achievementService.createDefaultAchievementsForUser(user.id);
          console.log("Created default achievements for user");
        } catch (err) {
          console.error("Failed to create default achievements:", err);
          // Continue execution even if achievement creation fails
        }
      }
      
      // Success - clear any errors
      setError(null);
    } catch (error) {
      console.error("Error in profile data loading:", error);
      
      // Create a fallback profile if this is the current user
      if (profileId === user?.id) {
        console.log("Creating fallback profile for current user");
        const fallbackProfile = {
          id: user.id,
          username: user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`,
          display_name: user.user_metadata?.name || 'Your Profile',
          bio: 'Welcome to your Clipt profile!',
          avatar_url: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`,
          created_at: new Date().toISOString(),
          followers: 0,
          following: 0,
          achievements: 0
        };
        
        setProfile(fallbackProfile);
        setStats({
          followers: 0,
          following: 0,
          achievements: 0
        });
        setUserPosts([]);
        setError(null); // Use fallback, don't show error
      } else {
        setError("Failed to load profile data");
      }
    } finally {
      setLoading(false);
    }
  };

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
          <Button onClick={() => navigate('/')}>
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
          <Button onClick={() => navigate('/')}>
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
                <UserLink username={profile.username} />
                <p className="text-gaming-300 max-w-md mb-4">{profile.bio || 'No bio provided'}</p>
              </div>
              
              <div className="flex justify-end gap-2">
                {isOwnProfile && (
                  <Button 
                    onClick={() => navigate('/profile/edit')} 
                    variant="outline" 
                    className="flex items-center gap-2 bg-[#1a1b4b] border border-white/10 text-white hover:bg-[#272a5b] px-4 py-1 rounded-sm"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Button>
                )}
                {!isOwnProfile && (
                  <Button
                    onClick={() => navigate(`/messages/${profileId}`)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Message</span>
                  </Button>
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
          {userPosts.length > 0 ? (
            userPosts.map(post => (
              <PostItem key={post.id} post={post} />
            ))
          ) : (
            <Card className="gaming-card p-8 flex flex-col items-center justify-center text-center h-60">
              <Gamepad2 className="w-12 h-12 text-gaming-400 mb-4" />
              <h3 className="text-xl font-semibold text-gaming-200 mb-2">No Clips Yet</h3>
              <p className="text-gaming-400">User hasn't posted any gaming clips</p>
            </Card>
          )}
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
