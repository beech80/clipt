import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Loader2, Settings, User, Grid, ListVideo, Trophy, Video, Heart, MessageSquare, FileText, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { followService } from '@/services/followService';
import { toast } from 'sonner';
import { StreamPlayer } from '@/components/streaming/StreamPlayer';
import { Badge } from '@/components/ui/badge';

interface ProfileData {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  banner_url?: string;
  bio?: string;
  followers_count?: number;
  following_count?: number;
  achievements_count?: number;
  is_following?: boolean;
  is_streaming?: boolean;
  stream_id?: string;
  stream_title?: string;
}

const UserProfile = () => {
  const { username: usernameParam, id: userIdParam } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [clips, setClips] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchProfileData = async (profileUserId: string) => {
    try {
      setLoading(true);
      
      let userId = profileUserId || user?.id;
      console.log("Initial user ID:", userId);
      
      // If we're on the /profile route with no ID, get the current user
      if (!userId && !userIdParam && user) {
        userId = user.id;
        console.log("Using current user ID:", userId);
      } else if (!userId) {
        throw new Error('No user ID provided');
      }
      
      console.log("Fetching profile data for user ID:", userId);
      
      // Fetch user profile data with detailed error handling
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error("Error fetching profile:", profileError);
        
        // Try a fallback approach if user doesn't exist in profiles
        console.log("Attempting fallback to auth.users...");
        
        const { data: authUserData, error: authError } = await supabase.auth.admin.getUserById(userId);
        
        if (authError || !authUserData || !authUserData.user) {
          console.error("Fallback failed:", authError);
          toast.error('User profile not found');
          setLoading(false);
          return;
        }
        
        // Create a basic profile for this user if they exist in auth but not in profiles
        const newProfileData = {
          id: userId,
          username: authUserData.user.email?.split('@')[0] || `user_${userId.slice(0, 8)}`,
          display_name: authUserData.user.user_metadata?.full_name || authUserData.user.email?.split('@')[0] || 'New User',
          avatar_url: authUserData.user.user_metadata?.avatar_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Try to insert this profile
        const { data: insertedProfile, error: insertError } = await supabase
          .from('profiles')
          .insert(newProfileData)
          .select()
          .single();
          
        if (insertError) {
          console.error("Failed to create profile:", insertError);
          toast.error('Failed to load profile data');
          setLoading(false);
          return;
        }
        
        console.log("Created new profile:", insertedProfile);
        setProfileData({
          id: insertedProfile.id,
          username: insertedProfile.username,
          display_name: insertedProfile.display_name || insertedProfile.username,
          avatar_url: insertedProfile.avatar_url,
          banner_url: 'https://placehold.co/1200x300/3f51b5/3f51b5',
          bio: insertedProfile.bio || '',
          followers_count: 0,
          following_count: 0,
          achievements_count: 0,
          is_following: false,
          is_streaming: false,
          stream_id: null,
          stream_title: null
        });
        setLoading(false);
        return;
      }
      
      const profileData = data;
      console.log("Profile data fetched:", profileData);
      
      // Check if the current user is following this profile
      let isFollowing = false;
      if (user && user.id !== userId) {
        try {
          isFollowing = await followService.isFollowing(user.id, userId);
        } catch (error) {
          console.error("Error checking following status:", error);
        }
      }
      
      // Fetch followers count with error handling
      let followersCount = 0;
      try {
        followersCount = await followService.getFollowersCount(userId);
      } catch (error) {
        console.error("Error fetching followers count:", error);
      }
      
      // Fetch following count with error handling
      let followingCount = 0;
      try {
        followingCount = await followService.getFollowingCount(userId);
      } catch (error) {
        console.error("Error fetching following count:", error);
      }
      
      // Check if the user is currently streaming
      let streamData = null;
      try {
        const { data: streamResult, error: streamError } = await supabase
          .from('streams')
          .select('id, title, viewer_count, started_at')
          .eq('user_id', userId)
          .order('started_at', { ascending: false })
          .limit(1)
          .single();
        
        if (!streamError && streamResult) {
          streamData = streamResult;
        }
      } catch (error) {
        console.error("Error fetching stream data:", error);
      }
      
      const isStreaming = !!streamData;
      
      // ENSURE PROFILE DATA COMPLETENESS
      // Some basic checks to make sure profile data is complete
      if (!profileData.avatar_url) {
        // Set a default avatar if none exists
        profileData.avatar_url = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.display_name || profileData.username)}&background=random`;
      }
      
      // Create a local copy with banner_url field
      const enhancedProfileData = {
        ...profileData,
        banner_url: (profileData as any).banner_url || 'https://placehold.co/1200x300/3f51b5/3f51b5',
        bio: profileData.bio || ''
      };
      
      if (!enhancedProfileData.banner_url) {
        // Set a default banner if none exists - with no text
        enhancedProfileData.banner_url = 'https://placehold.co/1200x300/3f51b5/3f51b5';
      }
      
      if (!enhancedProfileData.bio) {
        // Set a default bio if none exists
        enhancedProfileData.bio = '';
      }
      
      // Filter and prepare posts for display
      const loadData = async () => {
        setLoading(true);
        
        try {
          // Get all posts, regardless of type
          const { data: allPostsData, error: allPostsError } = await supabase
            .from('posts')
            .select('*')
            .eq('user_id', userId)
            .eq('is_published', true)
            .order('created_at', { ascending: false });
          
          if (allPostsError) {
            console.error('Error fetching all posts:', allPostsError);
            throw allPostsError;
          }
          
          console.log(`Found ${allPostsData?.length || 0} posts for user ${userId}`);
          
          // Separate posts and clips
          const regularPosts = allPostsData?.filter(post => post.post_type !== 'clipt') || [];
          const clipPosts = allPostsData?.filter(post => post.post_type === 'clipt') || [];
          
          console.log(`Regular posts: ${regularPosts.length}, Clips: ${clipPosts.length}`);
          
          setPosts(regularPosts);
          setClips(clipPosts);
          
          // Only create demo content if the user has no posts at all
          if (allPostsData?.length === 0) {
            console.log("Creating demo content - user has no posts");
            await createDemoContent();
          }
        } catch (error) {
          console.error('Error in loadData:', error);
          toast.error('Failed to load profile data');
        } finally {
          setLoading(false);
        }
      };
      
      // Create demo content if none exists
      const createDemoContent = async () => {
        try {
          console.log("Creating demo posts for user", userId);
          
          // Create demo posts (regular and clips)
          const demoPosts = [
            {
              user_id: userId,
              content: "Check out my latest gaming highlight!",
              post_type: "clipt",
              media_urls: JSON.stringify(["https://placehold.co/600x400/1a237e/ffffff?text=Gaming+Highlight"]),
              thumbnail_url: "https://placehold.co/600x400/1a237e/ffffff?text=Gaming+Highlight",
              created_at: new Date().toISOString(),
              likes_count: Math.floor(Math.random() * 50),
              comments_count: Math.floor(Math.random() * 10),
              game_id: "1",
              is_published: true
            },
            {
              user_id: userId,
              content: "Just finished an amazing gaming session! #gaming #streamer",
              post_type: "post",
              media_urls: JSON.stringify(["https://placehold.co/600x400/4a148c/ffffff?text=Gaming+Session"]),
              created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
              likes_count: Math.floor(Math.random() * 50),
              comments_count: Math.floor(Math.random() * 10),
              game_id: "2",
              is_published: true
            },
            {
              user_id: userId,
              content: "My latest gaming setup upgrade! What do you think?",
              post_type: "post",
              media_urls: JSON.stringify([
                "https://placehold.co/600x400/00695c/ffffff?text=Gaming+Setup+1",
                "https://placehold.co/600x400/004d40/ffffff?text=Gaming+Setup+2"
              ]),
              created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
              likes_count: Math.floor(Math.random() * 50),
              comments_count: Math.floor(Math.random() * 10),
              game_id: "3",
              is_published: true
            }
          ];
          
          // Insert the demo posts
          const { data: createdPosts, error: createError } = await supabase
            .from('posts')
            .insert(demoPosts)
            .select();
            
          if (createError) {
            console.error("Error creating demo posts:", createError);
            // If we can't create posts, use the demo data directly
            const regularDemoPosts = demoPosts.filter(post => post.post_type !== 'clipt');
            const clipDemoPosts = demoPosts.filter(post => post.post_type === 'clipt');
            
            setPosts(regularDemoPosts);
            setClips(clipDemoPosts);
          } else {
            console.log("Created demo posts successfully:", createdPosts);
            
            // Update state with the newly created demo posts
            if (createdPosts) {
              const regularCreatedPosts = createdPosts.filter(post => post.post_type !== 'clipt');
              const clipCreatedPosts = createdPosts.filter(post => post.post_type === 'clipt');
              
              setPosts(regularCreatedPosts);
              setClips(clipCreatedPosts);
            }
          }
        } catch (error) {
          console.error("Exception creating demo content:", error);
        }
      };
      
      await loadData();
      
      // Set profile data
      setProfileData({
        id: enhancedProfileData.id,
        username: enhancedProfileData.username,
        display_name: enhancedProfileData.display_name || enhancedProfileData.username,
        avatar_url: enhancedProfileData.avatar_url,
        banner_url: enhancedProfileData.banner_url,
        bio: enhancedProfileData.bio || '',
        followers_count: followersCount,
        following_count: followingCount,
        achievements_count: 0, // Placeholder for now
        is_following: isFollowing,
        is_streaming: isStreaming,
        stream_id: streamData?.id,
        stream_title: streamData?.title
      });
      
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      // Handle case when username is provided but not userId
      if (usernameParam && !userIdParam) {
        setLoading(true);
        try {
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', usernameParam)
            .single();
          
          if (userError) {
            throw userError;
          }
          
          if (userData) {
            // If we find the user by username, fetch their data
            await fetchProfileData(userData.id);
          } else {
            throw new Error('User not found');
          }
        } catch (error) {
          console.error("Error fetching user by username:", error);
          setError('User not found');
          setLoading(false);
        }
      } 
      // Handle case when userId is provided directly
      else if (userIdParam) {
        await fetchProfileData(userIdParam);
      } 
      // Default to current user if neither is provided
      else if (user) {
        await fetchProfileData(user.id);
      }
      // If no user is logged in and no username/userId provided, show error
      else {
        setError('No user specified');
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [usernameParam, userIdParam, user, refreshTrigger]);

  const handleFollowToggle = async () => {
    if (!user || !profileData) return;
    
    try {
      setFollowLoading(true);
      
      if (profileData.is_following) {
        await followService.unfollow(user.id, profileData.id);
        setProfileData(prev => prev ? {
          ...prev,
          is_following: false,
          followers_count: (prev.followers_count || 0) - 1
        } : null);
        toast.success(`Unfollowed @${profileData.username}`);
      } else {
        await followService.follow(user.id, profileData.id);
        setProfileData(prev => prev ? {
          ...prev,
          is_following: true,
          followers_count: (prev.followers_count || 0) + 1
        } : null);
        toast.success(`Following @${profileData.username}`);
      }
      
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'posts':
        return (
          <div>
            {posts && posts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {posts.map((post) => {
                  // Process media URLs to ensure we always have a valid array
                  let mediaUrls = [];
                  
                  try {
                    // Handle string format (JSON)
                    if (post.media_urls && typeof post.media_urls === 'string') {
                      try {
                        const parsed = JSON.parse(post.media_urls);
                        mediaUrls = Array.isArray(parsed) ? parsed : [parsed];
                      } catch (e) {
                        // If JSON parsing fails, handle as comma-separated or single URL
                        if (post.media_urls.includes(',')) {
                          mediaUrls = post.media_urls.split(',');
                        } else {
                          mediaUrls = [post.media_urls];
                        }
                      }
                    } 
                    // Handle already parsed array
                    else if (post.media_urls && Array.isArray(post.media_urls)) {
                      mediaUrls = post.media_urls;
                    }
                    // Handle legacy formats
                    else if (post.video_url) {
                      mediaUrls = [post.video_url];
                    }
                    else if (post.image_url) {
                      mediaUrls = [post.image_url];
                    }
                    
                    // Ensure we have at least one media URL
                    if (mediaUrls.length === 0) {
                      mediaUrls = ["https://placehold.co/600x400/673ab7/ffffff?text=No+Media"];
                    }
                  } catch (error) {
                    console.error("Error processing media URLs:", error);
                    mediaUrls = ["https://placehold.co/600x400/673ab7/ffffff?text=Error"];
                  }

                  return (
                    <div 
                      key={post.id} 
                      className="aspect-square relative group rounded-lg overflow-hidden cursor-pointer"
                      onClick={() => navigate(`/post/${post.id}`)}
                    >
                      {/* Media (first image/video) */}
                      <img 
                        src={mediaUrls[0]} 
                        alt={post.content} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://placehold.co/600x400/673ab7/ffffff?text=Post";
                        }}
                      />
                      
                      {/* Multiple media indicator */}
                      {mediaUrls.length > 1 && (
                        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                          +{mediaUrls.length}
                        </div>
                      )}
                      
                      {/* Hover overlay with post details */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 text-white">
                          <div className="text-sm truncate">{post.content}</div>
                          <div className="flex items-center mt-1 text-xs">
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              width="12" 
                              height="12" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                              className="mr-1"
                            >
                              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                            </svg>
                            <span className="mr-3">{post.likes_count || 0}</span>
                            
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              width="12" 
                              height="12" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                              className="mr-1"
                            >
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            <span>{post.comments_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <FileText className="h-12 w-12 mb-4 text-gray-300" />
                <p>No posts yet</p>
              </div>
            )}
          </div>
        );
      case 'clips':
        return (
          <div>
            {clips && clips.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {clips.map((clip) => {
                  // Process media URLs to ensure we always have a valid array
                  let mediaUrls = [];
                  
                  try {
                    // Handle string format (JSON)
                    if (clip.media_urls && typeof clip.media_urls === 'string') {
                      try {
                        const parsed = JSON.parse(clip.media_urls);
                        mediaUrls = Array.isArray(parsed) ? parsed : [parsed];
                      } catch (e) {
                        // If JSON parsing fails, handle as comma-separated or single URL
                        if (clip.media_urls.includes(',')) {
                          mediaUrls = clip.media_urls.split(',');
                        } else {
                          mediaUrls = [clip.media_urls];
                        }
                      }
                    } 
                    // Handle already parsed array
                    else if (clip.media_urls && Array.isArray(clip.media_urls)) {
                      mediaUrls = clip.media_urls;
                    }
                    // Handle legacy formats
                    else if (clip.video_url) {
                      mediaUrls = [clip.video_url];
                    }
                    else if (clip.image_url) {
                      mediaUrls = [clip.image_url];
                    }
                    
                    // Ensure we have at least one media URL
                    if (mediaUrls.length === 0) {
                      mediaUrls = ["https://placehold.co/600x400/311b92/ffffff?text=No+Media"];
                    }
                  } catch (error) {
                    console.error("Error processing media URLs:", error);
                    mediaUrls = ["https://placehold.co/600x400/311b92/ffffff?text=Error"];
                  }

                  return (
                    <div 
                      key={clip.id} 
                      className="bg-black/30 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10 shadow-xl cursor-pointer hover:border-purple-500/50 transition-colors"
                      onClick={() => navigate(`/post/${clip.id}`)}
                    >
                      <div className="aspect-video bg-gray-800 flex items-center justify-center relative">
                        {/* Thumbnail */}
                        <img 
                          src={clip.thumbnail_url || mediaUrls[0]} 
                          alt={clip.content} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/600x400/311b92/ffffff?text=Clip";
                          }}
                        />
                        
                        {/* Play button overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                          <div className="bg-white/10 rounded-full p-3 backdrop-blur-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          </div>
                        </div>
                        
                        {/* Multiple clips indicator */}
                        {mediaUrls.length > 1 && (
                          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                            +{mediaUrls.length}
                          </div>
                        )}
                        
                        {/* Video indicator */}
                        <div className="absolute bottom-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                          CLIP
                        </div>
                      </div>
                      
                      <div className="p-3">
                        <h3 className="text-white text-sm font-medium line-clamp-2">{clip.content}</h3>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            <img 
                              src={profileData?.avatar_url || "https://placehold.co/100/1a237e/ffffff?text=User"} 
                              alt={profileData?.username || ''} 
                              className="w-5 h-5 rounded-full"
                            />
                            <span className="text-xs text-gray-400">{profileData?.username || ''}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-gray-400">
                              <Heart className="w-3 h-3" />
                              <span className="text-xs">{clip.likes_count || 0}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                              <MessageSquare className="w-3 h-3" />
                              <span className="text-xs">{clip.comments_count || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Video className="h-12 w-12 mb-4 text-gray-300" />
                <p>No clips yet</p>
              </div>
            )}
          </div>
        );
      case 'achievements':
        return (
          <div className="flex items-center justify-center h-40 text-gray-400">
            No achievements available
          </div>
        );
      default:
        return null;
    }
  };

  const getMediaUrls = (post: any): string[] => {
    try {
      // Try to parse as JSON first
      if (post.media_urls && typeof post.media_urls === 'string') {
        try {
          return JSON.parse(post.media_urls);
        } catch (e) {
          console.error("Error parsing media_urls JSON:", e);
          // If JSON parsing fails, check if it's a comma-separated string
          if (post.media_urls.includes(',')) {
            return post.media_urls.split(',');
          }
          // If it's just a single URL
          return [post.media_urls];
        }
      } 
      // Handle case where media_urls might already be an array
      else if (post.media_urls && Array.isArray(post.media_urls)) {
        return post.media_urls;
      }
      // Check for legacy format with video_url
      else if (post.video_url) {
        return [post.video_url];
      }
      // Check for legacy format with image_url
      else if (post.image_url) {
        return [post.image_url];
      }
      // Default fallback
      return ["https://placehold.co/600x400/673ab7/ffffff?text=No+Media"];
    } catch (error) {
      console.error("Error in getMediaUrls:", error);
      return ["https://placehold.co/600x400/673ab7/ffffff?text=Error+Loading+Media"];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a237e] to-[#0d1b3c] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a237e] to-[#0d1b3c] flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-2xl">{error}</p>
          <button 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white font-medium transition"
            onClick={() => setRefreshTrigger(refreshTrigger + 1)}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a237e] to-[#0d1b3c] text-white">
      <div className="w-full relative">
        {/* Banner */}
        <div className="w-full h-[300px] bg-cover bg-center" style={{ backgroundImage: `url('${profileData?.banner_url}')` }} />

        {/* Profile info */}
        <div className="container mx-auto px-4 relative -mt-16">
          <div className="bg-[#1a237e]/70 backdrop-blur-md rounded-lg p-6 border border-indigo-500/30">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-indigo-500">
                  <img 
                    src={profileData?.avatar_url || "https://placehold.co/200/1a237e/ffffff?text=User"} 
                    alt={profileData?.username} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://placehold.co/200/1a237e/ffffff?text=User";
                    }}
                  />
                </div>
                
                {/* Streaming indicator */}
                {profileData?.is_streaming && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-1 flex items-center gap-1">
                    <span className="animate-pulse rounded-full h-2 w-2 bg-white"></span>
                    LIVE
                  </div>
                )}
              </div>
              
              {/* User info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold">{profileData?.display_name || profileData?.username}</h1>
                <p className="text-indigo-300 mb-2">@{profileData?.username}</p>
                
                {/* Stream title if streaming */}
                {profileData?.is_streaming && profileData?.stream_title && (
                  <div className="mb-3 bg-red-500/20 rounded-md p-2 border border-red-500/30">
                    <p className="font-semibold">Currently streaming: {profileData.stream_title}</p>
                    <p className="text-sm">{profileData?.stream_id} viewers</p>
                  </div>
                )}
                
                <p className="text-sm md:text-base whitespace-pre-wrap">{profileData?.bio || ""}</p>
                
                <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
                  {/* Follow button or Edit profile button */}
                  {user && user.id === profileData?.id ? (
                    <button 
                      onClick={() => navigate("/settings")}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white font-medium transition"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white font-medium transition">
                      Follow
                    </button>
                  )}
                  
                  {/* Message button (if not current user) */}
                  {user && user.id !== profileData?.id && (
                    <button className="px-4 py-2 bg-transparent border border-indigo-500 hover:bg-indigo-500/20 rounded-md text-white font-medium transition">
                      Message
                    </button>
                  )}
                  
                  {/* Share profile button */}
                  <button className="px-4 py-2 bg-transparent border border-indigo-500 hover:bg-indigo-500/20 rounded-md text-white font-medium transition">
                    Share Profile
                  </button>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex gap-6 text-center mt-4 md:mt-0">
                <div>
                  <div className="text-xl font-bold">
                    {posts.length + clips.length}
                  </div>
                  <div className="text-indigo-300 text-sm">Posts</div>
                </div>
                <div>
                  <div className="text-xl font-bold">{profileData?.followers_count || 0}</div>
                  <div className="text-indigo-300 text-sm">Followers</div>
                </div>
                <div>
                  <div className="text-xl font-bold">{profileData?.following_count || 0}</div>
                  <div className="text-indigo-300 text-sm">Following</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex mb-6 border-b border-white/10">
        <button
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium ${
            activeTab === 'posts'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('posts')}
        >
          <Grid className="h-4 w-4" />
          Posts
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium ${
            activeTab === 'clips'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('clips')}
        >
          <ListVideo className="h-4 w-4" />
          Clipts
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium ${
            activeTab === 'achievements'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('achievements')}
        >
          <Trophy className="h-4 w-4" />
          Trophies
        </button>
      </div>

      {/* Content Area */}
      {renderContent()}
    </div>
  );
};

export default UserProfile;
