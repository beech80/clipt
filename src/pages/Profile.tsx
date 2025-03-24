import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Gamepad2, Trophy, MessageSquare, Settings, UserX, Bookmark, Film, Image, FileText } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useParams, useNavigate } from "react-router-dom";
import AchievementList from "@/components/achievements/AchievementList";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Profile as ProfileType, ProfileStats } from "@/types/profile";
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
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userCollection, setUserCollection] = useState<any[]>([]);
  const [savedVideos, setSavedVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'clips' | 'achievements' | 'collection' | 'saved_videos'>('clips');
  const [stats, setStats] = useState<ProfileStats>({
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
      console.log("Fetching profile data for user:", userId);
      
      // Try to get the profile by ID
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*') // Explicitly select all fields
        .eq('id', userId)
        .single();
      
      // If there's an error or no profile for current user, create one
      if (error || !profileData) {
        console.log("Profile fetch error:", error);
        
        if (userId === user?.id) {
          console.log("No profile found for current user, creating one");
          
          // Create a default profile for the current user
          const defaultProfile: Partial<ProfileType> = {
            id: userId,
            username: `user_${userId.substring(0, 8)}`,
            display_name: user?.user_metadata?.name || 'New User',
            bio: 'Welcome to my Clipt profile!',
            avatar_url: user?.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + userId,
            created_at: new Date().toISOString(),
            followers_count: 0,
            following_count: 0,
            achievements_count: 0,
            // Default settings
            enable_notifications: true,
            enable_sounds: true
          };
          
          // First create the profile
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .upsert(defaultProfile)
            .select()
            .single();
          
          if (createError) {
            console.error("Error creating profile:", createError);
            throw new Error('Failed to create profile');
          }
          
          // Then initialize default achievements for the new user
          try {
            const { achievementService } = await import('@/services/achievementService');
            await achievementService.createDefaultAchievementsForUser(userId);
            console.log("Successfully created default achievements for new user");
            
            // Update the achievements count
            await supabase
              .from('profiles')
              .update({ achievements_count: 10 }) // Assuming 10 default achievements are created
              .eq('id', userId);
              
            // Update the achievements count in the profile object
            newProfile.achievements_count = 10;
          } catch (achievementError) {
            console.error("Error creating default achievements:", achievementError);
            // Continue even if achievements creation fails
            // The user can still use the app
          }
          
          return newProfile as ProfileType;
        } else {
          // Profile doesn't exist and it's not the current user
          console.error("Profile not found for user:", userId);
          return null;
        }
      }
      
      // If profile exists but has no achievements, create default ones
      if (profileData && userId === user?.id && (!profileData.achievements_count || profileData.achievements_count === 0)) {
        try {
          console.log("Creating default achievements for existing user with no achievements");
          const { achievementService } = await import('@/services/achievementService');
          await achievementService.createDefaultAchievementsForUser(userId);
          
          // Update the achievements count
          await supabase
            .from('profiles')
            .update({ achievements_count: 10 }) // Assuming 10 default achievements
            .eq('id', userId);
            
          // Update the achievements count in the profile object
          profileData.achievements_count = 10;
          
          console.log("Successfully added default achievements to existing profile");
        } catch (achievementError) {
          console.error("Error creating default achievements for existing user:", achievementError);
          // Continue even if achievements creation fails
        }
      }
      
      return profileData as ProfileType;
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
          followers_count: 0,
          following_count: 0,
          achievements_count: 0,
          // Default settings
          enable_notifications: true,
          enable_sounds: true
        } as ProfileType;
      }
      return null;
    }
  };

  /**
   * Fetch user data including profile, posts, and stats
   */
  const fetchUserData = useCallback(async () => {
    if (!profileId) {
      setError("No profile ID available");
      setLoading(false);
      return;
    }
    
    try {
      console.log('Fetching user data for profile:', profileId);
      setLoading(true);
      setError(null);
      
      // Get basic profile data first
      const profileData = await fetchProfileData(profileId);
      
      if (!profileData) {
        setError("Profile not found");
        setLoading(false);
        return;
      }
      
      setProfile(profileData);
      
      // Get user posts (clips)
      const { data: userPostsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          image_url,
          video_url,
          created_at,
          likes_count,
          comments_count,
          game_id,
          profile_id,
          is_published,
          profiles (
            id,
            username,
            avatar_url,
            display_name
          ),
          games (
            id,
            name,
            cover_url
          )
        `)
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      
      if (postsError) {
        console.error("Error fetching user posts:", postsError);
        setUserPosts([]);
      } else {
        // Log for debugging purposes
        console.log("User posts fetched:", userPostsData?.length || 0, userPostsData);
        
        if (!userPostsData || userPostsData.length === 0) {
          // Try fetching without any filters to see if posts exist at all
          const { data: allPosts, error: allPostsError } = await supabase
            .from('posts')
            .select(`
              id,
              title,
              content,
              image_url,
              video_url,
              created_at,
              likes_count,
              comments_count,
              game_id,
              profile_id,
              is_published
            `)
            .eq('profile_id', profileId);
            
          console.log("Fallback - All posts for user:", allPosts?.length || 0, allPosts);
          
          if (!allPostsError && allPosts && allPosts.length > 0) {
            setUserPosts(allPosts);
          } else {
            // Last attempt - try to fetch posts with minimal restrictions
            const { data: lastAttemptPosts, error: lastAttemptError } = await supabase
              .from('posts')
              .select('*')
              .eq('profile_id', profileId);
              
            console.log("Last attempt - Simple posts query:", lastAttemptPosts?.length || 0, lastAttemptPosts);
            
            if (!lastAttemptError && lastAttemptPosts && lastAttemptPosts.length > 0) {
              setUserPosts(lastAttemptPosts);
            } else {
              setUserPosts([]);
              console.log("No posts found for profile ID:", profileId);
            }
          }
        } else {
          setUserPosts(userPostsData);
        }
      }
      
      // Get saved videos if it's the user's own profile or if the profile is not private
      if (isOwnProfile || (profile && !profile.is_private)) {
        try {
          // First check if the saved_videos table exists
          const { error: tableCheckError } = await supabase
            .from('saved_videos')
            .select('id')
            .limit(1);
          
          // If the table doesn't exist or there's another error, don't show an error to the user
          if (!tableCheckError) {
            // Get the saved videos
            const { data: savedVideosData, error: savedVideosError } = await supabase
              .from('saved_videos')
              .select(`
                id,
                post_id,
                saved_at,
                posts (
                  id,
                  title,
                  content,
                  image_url,
                  video_url,
                  created_at,
                  likes_count,
                  comments_count,
                  game_id,
                  profile_id,
                  is_published,
                  profiles (
                    id,
                    username,
                    avatar_url,
                    display_name
                  ),
                  games (
                    id,
                    name,
                    cover_url
                  )
                )
              `)
              .eq('user_id', profileId)
              .order('saved_at', { ascending: false });
            
            if (savedVideosError) {
              console.error("Error fetching saved videos:", savedVideosError);
            } else if (savedVideosData && savedVideosData.length > 0) {
              // Transform the data to match the PostItem component expectations
              const formattedSavedVideos = savedVideosData.map(item => {
                return {
                  ...item.posts,
                  saved_at: item.saved_at
                };
              }).filter(Boolean); // Remove any null entries
              
              setSavedVideos(formattedSavedVideos);
            } else {
              setSavedVideos([]);
            }
          }
        } catch (e) {
          console.error("Error processing saved videos:", e);
        }
      }
      
      // Get collection posts if it's the user's own profile
      if (user && user.id === profileId) {
        // Fetch posts that the user has added to their collection
        const { data: collectionData, error: collectionError } = await supabase
          .from('collection_posts')
          .select(`
            id,
            collection_id,
            post_id,
            added_at,
            posts:post_id(
              id,
              title,
              content,
              image_url,
              video_url,
              created_at,
              likes_count,
              comments_count,
              game_id,
              profile_id,
              profiles(
                id,
                username,
                avatar_url,
                display_name
              ),
              games(
                id,
                name,
                cover_url
              )
            )
          `)
          .eq('collection_id', async () => {
            // Get user's default collection ID
            const { data: collections } = await supabase
              .from('collections')
              .select('id')
              .eq('user_id', profileId)
              .eq('name', 'Saved Clips')
              .single();
            return collections?.id;
          })
          .order('added_at', { ascending: false });
        
        if (collectionError) {
          console.error("Error fetching user collection:", collectionError);
        } else {
          // Extract the posts from the collection data
          const collectionPosts = collectionData?.map(item => item.posts) || [];
          setUserCollection(collectionPosts.filter(Boolean));
        }
      }
      
      // Update stats based on profile data
      setStats({
        followers: profileData.followers_count || 0,
        following: profileData.following_count || 0,
        achievements: profileData.achievements_count || 0,
      });
      
      // Get detailed follow stats if needed
      try {
        // Only fetch the count of these relationships
        const { count: followersCount, error: followersError } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true})
          .eq('following_id', profileId);
        
        const { count: followingCount, error: followingError } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true})
          .eq('follower_id', profileId);
        
        if (!followersError && !followingError) {
          setStats(prevStats => ({
            ...prevStats,
            followers: followersCount || 0,
            following: followingCount || 0
          }));
          
          // Also update the profile state with these counts
          setProfile(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              followers_count: followersCount || 0,
              following_count: followingCount || 0
            };
          });
        }
      } catch (statsError) {
        console.error("Error fetching follow stats:", statsError);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError(err instanceof Error ? err.message : "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  }, [profileId, fetchProfileData, user?.id]);

  // Load profile data when component mounts or profile ID changes
  useEffect(() => {
    if (!profileId) return;
    
    setLoading(true);
    setError(null);
    
    // Add a delay to ensure auth context is fully loaded
    const timer = setTimeout(() => {
      fetchUserData();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [profileId, user]);

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
          <div className="flex flex-wrap gap-2">
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
              pressed={activeTab === 'collection'}
              onPressedChange={() => setActiveTab('collection')}
              variant="outline"
              className="flex gap-2 items-center"
            >
              <Bookmark className="w-4 h-4" />
              <span>Collections</span>
            </Toggle>
            <Toggle
              pressed={activeTab === 'saved_videos'}
              onPressedChange={() => setActiveTab('saved_videos')}
              variant="outline"
              className="flex gap-2 items-center"
            >
              <Bookmark className="w-4 h-4" />
              <span>Saved Videos</span>
            </Toggle>
            <Toggle
              pressed={activeTab === 'achievements'}
              onPressedChange={() => setActiveTab('achievements')}
              variant="outline"
              className="flex gap-2 items-center"
            >
              <Trophy className="w-4 h-4" />
              <span>Trophies</span>
            </Toggle>
          </div>
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'clips' ? (
        <div className="grid grid-cols-3 gap-2">
          {userPosts.length > 0 ? (
            userPosts.map(post => (
              <div 
                key={post.id} 
                className="aspect-square overflow-hidden rounded-md relative hover:opacity-90 transition-opacity cursor-pointer"
                onClick={() => navigate(`/post/${post.id}`)}
              >
                {post.video_url ? (
                  <div className="relative w-full h-full">
                    <video 
                      src={post.video_url} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 p-2 bg-gradient-to-t from-black/80 to-transparent w-full">
                      <p className="text-xs text-white truncate">{post.title || post.content || 'Video clip'}</p>
                    </div>
                    <div className="absolute top-2 right-2 bg-black/60 p-1 rounded text-xs text-white">
                      <Film className="w-3 h-3 inline mr-1" />
                    </div>
                  </div>
                ) : post.image_url ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={post.image_url} 
                      alt={post.content || 'Post image'} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        console.log(`Image failed to load: ${target.src}`);
                        // Set a fallback image
                        target.src = 'https://placehold.co/300x300/121212/404040?text=No+Image';
                      }}
                    />
                    <div className="absolute bottom-0 left-0 p-2 bg-gradient-to-t from-black/80 to-transparent w-full">
                      <p className="text-xs text-white truncate">{post.title || post.content || 'Image post'}</p>
                    </div>
                    <div className="absolute top-2 right-2 bg-black/60 p-1 rounded text-xs text-white">
                      <Image className="w-3 h-3 inline mr-1" />
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full bg-gaming-800 flex flex-col items-center justify-center text-gaming-400 p-2">
                    <FileText className="w-6 h-6 mb-2" />
                    <p className="text-xs text-center">{post.title || post.content || 'Text post'}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <Card className="gaming-card p-8 flex flex-col items-center justify-center text-center h-60 col-span-3">
              <Gamepad2 className="w-12 h-12 text-gaming-400 mb-4" />
              <h3 className="text-xl font-semibold text-gaming-200 mb-2">No Clips Yet</h3>
              <p className="text-gaming-400">User hasn't posted any gaming clips</p>
              {isOwnProfile && (
                <div className="mt-4">
                  <Button onClick={() => navigate('/post/new')} variant="outline">
                    Upload Your First Clip
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>
      ) : activeTab === 'collection' ? (
        <div className="grid grid-cols-3 gap-2">
          {userCollection.length > 0 ? (
            userCollection.map(post => (
              <div 
                key={post.id} 
                className="aspect-square overflow-hidden rounded-md relative hover:opacity-90 transition-opacity cursor-pointer"
                onClick={() => navigate(`/post/${post.id}`)}
              >
                {post.video_url ? (
                  <div className="relative w-full h-full">
                    <video 
                      src={post.video_url} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 p-2 bg-gradient-to-t from-black/80 to-transparent w-full">
                      <p className="text-xs text-white truncate">{post.title || post.content || 'Video clip'}</p>
                    </div>
                    <div className="absolute top-2 right-2 bg-black/60 p-1 rounded text-xs text-white">
                      <Film className="w-3 h-3 inline mr-1" />
                    </div>
                  </div>
                ) : post.image_url ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={post.image_url} 
                      alt={post.content || 'Post image'} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        console.log(`Image failed to load: ${target.src}`);
                        // Set a fallback image
                        target.src = 'https://placehold.co/300x300/121212/404040?text=No+Image';
                      }}
                    />
                    <div className="absolute bottom-0 left-0 p-2 bg-gradient-to-t from-black/80 to-transparent w-full">
                      <p className="text-xs text-white truncate">{post.title || post.content || 'Image post'}</p>
                    </div>
                    <div className="absolute top-2 right-2 bg-black/60 p-1 rounded text-xs text-white">
                      <Image className="w-3 h-3 inline mr-1" />
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full bg-gaming-800 flex flex-col items-center justify-center text-gaming-400 p-2">
                    <FileText className="w-6 h-6 mb-2" />
                    <p className="text-xs text-center">{post.title || post.content || 'Text post'}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <Card className="gaming-card p-8 flex flex-col items-center justify-center text-center h-60 col-span-3">
              <Bookmark className="w-12 h-12 text-gaming-400 mb-4" />
              <h3 className="text-xl font-semibold text-gaming-200 mb-2">Collection Empty</h3>
              <p className="text-gaming-400">No clips saved to collections yet</p>
              {isOwnProfile && (
                <div className="mt-4">
                  <Button onClick={() => navigate('/')} variant="outline">
                    Find Clips to Save
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>
      ) : activeTab === 'saved_videos' ? (
        <div className="grid grid-cols-3 gap-2">
          {savedVideos.length > 0 ? (
            savedVideos.map(item => {
              // Extract the post from the joined data
              const post = item;
              if (!post) return null;
              
              return (
                <div 
                  key={post.id} 
                  className="aspect-square overflow-hidden rounded-md relative hover:opacity-90 transition-opacity cursor-pointer"
                  onClick={() => navigate(`/post/${post.id}`)}
                >
                  {post.video_url ? (
                    <div className="relative w-full h-full">
                      <video 
                        src={post.video_url} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 p-2 bg-gradient-to-t from-black/80 to-transparent w-full">
                        <p className="text-xs text-white truncate">{post.title || post.content || 'Video clip'}</p>
                      </div>
                      <div className="absolute top-2 right-2 bg-black/60 p-1 rounded text-xs text-white">
                        <Film className="w-3 h-3 inline mr-1" />
                      </div>
                    </div>
                  ) : post.image_url ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={post.image_url} 
                        alt={post.content || 'Post image'} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          console.log(`Image failed to load: ${target.src}`);
                          // Set a fallback image
                          target.src = 'https://placehold.co/300x300/121212/404040?text=No+Image';
                        }}
                      />
                      <div className="absolute bottom-0 left-0 p-2 bg-gradient-to-t from-black/80 to-transparent w-full">
                        <p className="text-xs text-white truncate">{post.title || post.content || 'Image post'}</p>
                      </div>
                      <div className="absolute top-2 right-2 bg-black/60 p-1 rounded text-xs text-white">
                        <Image className="w-3 h-3 inline mr-1" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gaming-800 flex flex-col items-center justify-center text-gaming-400 p-2">
                      <FileText className="w-6 h-6 mb-2" />
                      <p className="text-xs text-center">{post.title || post.content || 'Text post'}</p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <Card className="gaming-card p-8 flex flex-col items-center justify-center text-center h-60 col-span-3">
              <Bookmark className="w-12 h-12 text-gaming-400 mb-4" />
              <h3 className="text-xl font-semibold text-gaming-200 mb-2">No Saved Videos</h3>
              <p className="text-gaming-400">User hasn't saved any videos yet</p>
              {isOwnProfile && (
                <div className="mt-4">
                  <Button onClick={() => navigate('/')} variant="outline">
                    Find Videos to Save
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>
      ) : (
        <div className="col-span-3">
          <AchievementList userId={profileId || ''} forceShowDemo={true} />
        </div>
      )}
    </ProfileContent>
  );
};

export default Profile;
