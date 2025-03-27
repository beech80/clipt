import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Loader2, Settings, User, Grid, ListVideo, Trophy, Video, Heart, MessageSquare, FileText, RefreshCw, Share2, MessageCircle, Send, Bookmark } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import achievementService from '@/services/achievementService';
import achievementTrackerService from '@/services/achievementTrackerService';
import AchievementDisplay, { ACHIEVEMENT_CATEGORIES } from '@/components/achievements/AchievementDisplay';
import { toast } from 'react-hot-toast';
import { followService } from '@/services/followService';
import { format } from 'date-fns';

interface ProfileData {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  banner_url: string;
  bio: string;
  followers_count: number;
  following_count: number;
  achievements_count: number;
  is_following: boolean;
  stream_id: string | null;
  stream_title: string | null;
}

interface Achievement {
  id: string;
  achievement: {
    id: string;
    name: string;
    description: string;
    image?: string;
    target_value?: number;
    reward_type?: 'points' | 'badge' | 'title';
    points?: number;
  };
  completed: boolean;
  currentValue: number;
  user_id: string;
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  post_type: string;
  media_urls: string[] | string;
  thumbnail_url?: string;
  image_url?: string | null;
  video_url?: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  game_id: string;
  is_published: boolean;
  profiles: {
    username: string;
    avatar_url: string;
    display_name?: string;
  } | null;
  liked_by_current_user: boolean;
  comments: any[];
}

const UserProfile = () => {
  const { username: usernameParam, id: userIdParam } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [clips, setClips] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'clips' | 'saved' | 'achievements'>('posts');
  const [selectedAchievementCategory, setSelectedAchievementCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserProfileId, setCurrentUserProfileId] = useState<string | null>(null);

  // Process the profile data from Supabase
  const processProfileData = (rawProfileData: any, userId: string, isFollowing: boolean = false, streamData: any = null): ProfileData => {
    return {
      id: userId,
      username: rawProfileData?.username || 'user',
      display_name: rawProfileData?.display_name || rawProfileData?.username || 'User',
      avatar_url: rawProfileData?.avatar_url || '',
      banner_url: rawProfileData?.banner_url || '',
      bio: rawProfileData?.bio || '',
      followers_count: rawProfileData?.followers_count || 0,
      following_count: rawProfileData?.following_count || 0,
      achievements_count: rawProfileData?.achievements_count || 0,
      is_following: isFollowing,
      stream_id: streamData?.id || null,
      stream_title: streamData?.title || null,
    };
  };

  // Process post data to ensure consistent format
  const processPost = (post: any): Post => {
    let mediaUrls;
    
    // Handle different formats of media_urls - more robust parsing
    if (post.media_urls) {
      if (typeof post.media_urls === 'string') {
        try {
          // Try to parse JSON string
          const parsed = JSON.parse(post.media_urls);
          mediaUrls = Array.isArray(parsed) ? parsed : [post.media_urls];
        } catch (e) {
          // If parsing fails, use the string directly
          mediaUrls = [post.media_urls];
        }
      } else if (Array.isArray(post.media_urls)) {
        mediaUrls = post.media_urls;
      } else {
        // If it's neither string nor array, use empty array
        mediaUrls = [];
      }
    } else {
      mediaUrls = [];
    }
    
    // Fallback to other fields if media_urls not available
    if ((!mediaUrls || mediaUrls.length === 0) && 
        (post.image_url || post.video_url || post.thumbnail_url)) {
      mediaUrls = [post.video_url || post.image_url || post.thumbnail_url].filter(Boolean);
    }
    
    return {
      id: post.id || `temp-${Date.now()}-${Math.random()}`,
      user_id: post.user_id || '',
      content: post.content || '',
      post_type: post.post_type || 'post',
      media_urls: mediaUrls || [],
      thumbnail_url: post.thumbnail_url || (mediaUrls && mediaUrls.length > 0 ? mediaUrls[0] : ''),
      created_at: post.created_at || new Date().toISOString(),
      likes_count: typeof post.likes_count === 'number' ? post.likes_count : 0,
      comments_count: typeof post.comments_count === 'number' ? post.comments_count : 0,
      game_id: post.game_id || '',
      is_published: post.is_published !== false,
      profiles: post.profiles || null,
      liked_by_current_user: false,
      comments: post.comments || []
    };
  };

  // Fetch user profile data and achievements
  useEffect(() => {
    const fetchUserProfileData = async () => {
      try {
        setLoading(true);
        
        if (!userIdParam && !usernameParam) {
          setLoading(false);
          return;
        }

        let userId = userIdParam || user?.id;

        if (!userId && usernameParam) {
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', usernameParam)
            .single();

          if (userError) {
            throw userError;
          }

          if (userData) {
            userId = userData.id;
          } else {
            throw new Error('User not found');
          }
        }

        // Fetch profile data
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setLoading(false);
          return;
        }

        // Check if this profile is being followed by the current user
        let isFollowingProfile = false;
        if (user) {
          const { data: followingData } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', user.id)
            .eq('following_id', userId)
            .maybeSingle();
          
          isFollowingProfile = !!followingData;
        }

        // Get follower and following counts
        const { count: followersCount } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId);
        
        const { count: followingCount } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId);

        // Get stream information if any
        const { data: streamData } = await supabase
          .from('streams')
          .select('id, title')
          .eq('user_id', userId)
          .maybeSingle();

        // Fetch achievements - now using achievementTrackerService for better organization
        let userAchievements = [];
        try {
          if (user && user.id === userId) {
            // If viewing own profile, get detailed achievement progress
            const categorizedAchievements = await achievementTrackerService.getAchievementsByCategories(userId);
            userAchievements = Object.values(categorizedAchievements).flat();
          } else {
            // If viewing someone else's profile, get basic achievements
            const { data } = await supabase
              .from('user_achievements')
              .select('*, achievement:achievements(*)')
              .eq('user_id', userId)
              .eq('completed', true);
            userAchievements = data || [];
          }
        } catch (e) {
          console.error('Error fetching achievements:', e);
          // Fallback to mock data for demo purposes
          userAchievements = achievementService.getMockAchievements();
        }

        // Set state variables
        setProfileData({
          ...profileData,
          followers_count: followersCount || 0,
          following_count: followingCount || 0,
          achievements_count: userAchievements.filter(a => a.completed).length,
          is_following: isFollowingProfile,
          stream_id: streamData?.id || null,
          stream_title: streamData?.title || null
        });
        
        setAchievements(userAchievements);
        setCurrentUserProfileId(userId);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setLoading(false);
      }
    };

    fetchUserProfileData();
  }, [userIdParam, usernameParam, user]);

  useEffect(() => {
    const fetchUserContent = async () => {
      try {
        if (!currentUserProfileId) return;

        // Fetch posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*, profiles:profiles(username, avatar_url, display_name)')
          .eq('user_id', currentUserProfileId)
          .eq('post_type', 'post')
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;

        // Fetch clips
        const { data: clipsData, error: clipsError } = await supabase
          .from('posts')
          .select('*, profiles:profiles(username, avatar_url, display_name)')
          .eq('user_id', currentUserProfileId)
          .eq('post_type', 'clip')
          .order('created_at', { ascending: false });

        if (clipsError) throw clipsError;

        // Fetch saved posts if viewing own profile
        let savedPostsData: any[] = [];
        if (user && user.id === currentUserProfileId) {
          const { data: savedPostIds, error: savedError } = await supabase
            .from('bookmarks')
            .select('post_id')
            .eq('user_id', user.id);

          if (!savedError && savedPostIds && savedPostIds.length > 0) {
            const postIds = savedPostIds.map(item => item.post_id);
            
            const { data: savedPosts, error: fetchSavedError } = await supabase
              .from('posts')
              .select('*, profiles:profiles(username, avatar_url, display_name)')
              .in('id', postIds)
              .order('created_at', { ascending: false });
              
            if (!fetchSavedError) {
              savedPostsData = savedPosts || [];
            }
          }
        }

        // Process likes for posts if user is logged in
        let processedPosts = postsData || [];
        let processedClips = clipsData || [];
        let processedSavedPosts = savedPostsData || [];

        if (user) {
          const { data: likedPosts } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', user.id);

          const likedPostIds = new Set((likedPosts || []).map(like => like.post_id));

          processedPosts = processedPosts.map(post => ({
            ...post,
            liked_by_current_user: likedPostIds.has(post.id),
            username: post.profiles?.username,
            avatar_url: post.profiles?.avatar_url,
            display_name: post.profiles?.display_name
          }));

          processedClips = processedClips.map(clip => ({
            ...clip,
            liked_by_current_user: likedPostIds.has(clip.id),
            username: clip.profiles?.username,
            avatar_url: clip.profiles?.avatar_url,
            display_name: clip.profiles?.display_name
          }));

          processedSavedPosts = processedSavedPosts.map(post => ({
            ...post,
            liked_by_current_user: likedPostIds.has(post.id),
            username: post.profiles?.username,
            avatar_url: post.profiles?.avatar_url,
            display_name: post.profiles?.display_name
          }));
        }

        setPosts(processedPosts);
        setClips(processedClips);
        setSavedPosts(processedSavedPosts);
      } catch (error) {
        console.error('Error fetching user content:', error);
      }
    };

    fetchUserContent();

    // Also update trophy-related achievements if viewing own profile
    const updateTrophyAchievements = async () => {
      if (user && currentUserProfileId && user.id === currentUserProfileId) {
        try {
          // Get the post with the highest trophy count
          const { data: highestTrophyPost } = await supabase
            .from('posts')
            .select('id, trophy_count')
            .eq('user_id', currentUserProfileId)
            .order('trophy_count', { ascending: false })
            .limit(1);
          
          if (highestTrophyPost && highestTrophyPost.length > 0) {
            const { id: postId, trophy_count } = highestTrophyPost[0];
            // Update trophy achievements
            await achievementTrackerService.updateTrophyAchievements(currentUserProfileId, postId, trophy_count);
          }
          
          // Update follower-related achievements
          const { count: followerCount } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', currentUserProfileId);
            
          if (followerCount !== null) {
            await achievementTrackerService.updateFollowerAchievements(currentUserProfileId, followerCount);
          }
        } catch (error) {
          console.error('Error updating achievements:', error);
        }
      }
    };
    
    updateTrophyAchievements();
  }, [currentUserProfileId, user]);

  const handleFollowToggle = async () => {
    if (!user || !profileData) return;

    try {
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
    }
  };

  const handlePostClick = (postId: string) => {
    navigate(`/post/${postId}`);
  };

  // Render posts grid in Xbox-style game-like appearance
  const renderPostsGrid = (postsToRender: Post[]) => {
    if (!postsToRender || postsToRender.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-gray-300 bg-[#0f0f0f] rounded-lg my-4 border border-[#282828]">
          <FileText className="h-16 w-16 mb-6 text-gray-300 opacity-50" />
          
          {activeTab === 'posts' && (
            <div className="text-center max-w-md">
              <p className="text-xl font-semibold mb-2">This user hasn't posted anything yet</p>
              <p className="text-gray-400">When they share posts, you'll see them here.</p>
            </div>
          )}
          
          {activeTab === 'clips' && (
            <div className="text-center max-w-md">
              <p className="text-xl font-semibold mb-2">No clips available</p>
              <p className="text-gray-400">This user hasn't created any video clips yet.</p>
            </div>
          )}
          
          {activeTab === 'saved' && (
            <div className="text-center max-w-md">
              <p className="text-xl font-semibold mb-2">No saved content</p>
              <p className="text-gray-400">When you save posts and clips from others, they'll appear here.</p>
            </div>
          )}
          
          {activeTab === 'achievements' && (
            <div className="text-center max-w-md">
              <p className="text-xl font-semibold mb-2">No achievements yet</p>
              <p className="text-gray-400">This user hasn't earned any achievements.</p>
            </div>
          )}
        </div>
      );
    }

    console.log("Rendering posts grid with posts:", postsToRender);

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 bg-[#0f0f0f] rounded-lg my-4 border border-[#282828]">
        {postsToRender.map(post => {
          if (!post || !post.id) return null;
          
          // Get the first media URL if available with robust fallbacks
          let mediaUrl = null;
          try {
            if (post.media_urls) {
              if (typeof post.media_urls === 'string') {
                try {
                  // Try to parse JSON string
                  const parsed = JSON.parse(post.media_urls);
                  mediaUrl = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : post.media_urls;
                } catch (e) {
                  // If parsing fails, use the string directly
                  mediaUrl = post.media_urls;
                }
              } else if (Array.isArray(post.media_urls) && post.media_urls.length > 0) {
                mediaUrl = post.media_urls[0];
              }
            }

            // Fallback to other fields if not found
            if (!mediaUrl) {
              if (post.thumbnail_url) mediaUrl = post.thumbnail_url;
              else if (post.image_url !== null && post.image_url !== undefined) mediaUrl = post.image_url;
              else if (post.video_url !== null && post.video_url !== undefined) mediaUrl = post.video_url;
            }
          } catch (error) {
            console.error("Error processing media URL for post:", post.id, error);
            mediaUrl = null;
          }

          const postContent = post.content || 'No content';

          return (
            <div 
              key={post.id}
              onClick={() => handlePostClick(post.id)}
              className="bg-[#1a1a1a] rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:translate-y-[-4px] hover:shadow-xl border border-[#282828] hover:border-[#107C10]"
            >
              <div className="aspect-video overflow-hidden relative">
                {mediaUrl ? (
                  <img 
                    src={mediaUrl} 
                    alt={post.content?.substring(0, 20) || "Post"} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log(`Image load error for post ${post.id}:`, e);
                      const target = e.target as HTMLImageElement;
                      target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23101010'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%23107C10' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#101010] p-4">
                    <FileText className="h-12 w-12 text-[#107C10] mb-2" />
                    <div className="text-white text-center">Text Post</div>
                  </div>
                )}
                
                {/* Post type indicator */}
                <div className="absolute top-2 right-2 bg-black bg-opacity-70 px-2 py-1 rounded text-xs text-white">
                  {post.post_type === 'clip' ? 'Clip' : 'Post'}
                </div>
              </div>

              <div className="p-3">
                <div className="text-white font-semibold mb-2 line-clamp-2">
                  {postContent}
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <div className="flex space-x-3">
                    <div className="flex items-center space-x-1 text-gray-400">
                      <Heart className={`h-4 w-4 ${post.liked_by_current_user ? 'text-red-500' : 'text-gray-400'}`} />
                      <span className="text-xs">{post.likes_count || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-400">
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-xs">{post.comments_count || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-400">
                      <Trophy className="h-4 w-4 text-[#107C10]" />
                      <span className="text-xs">{post.trophy_count || 0}</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    {post.created_at ? format(new Date(post.created_at), 'MMM d, yyyy') : ''}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPostsTab = () => {
    return renderPostsGrid(posts);
  };

  const renderClipsTab = () => {
    return renderPostsGrid(clips);
  };

  const renderSavedTab = () => {
    // Only show saved posts if viewing own profile
    if (user && profileData && user.id !== profileData.id) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <FileText className="h-12 w-12 mb-4 text-gray-300" />
          <p>Saved posts are only visible on your own profile</p>
        </div>
      );
    }
    
    return renderPostsGrid(savedPosts);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return renderPostsTab();
      case 'clips':
        return renderClipsTab();
      case 'saved':
        return renderSavedTab();
      case 'achievements':
        return (
          <div className="p-4">
            {/* Achievement category filters */}
            <div className="mb-6 overflow-x-auto">
              <div className="flex space-x-2 pb-2">
                <Button 
                  variant={selectedAchievementCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedAchievementCategory(null)}
                  className="whitespace-nowrap"
                >
                  All Achievements
                </Button>
                
                {Object.entries(ACHIEVEMENT_CATEGORIES).map(([key, category]) => {
                  // Check if there are achievements in this category
                  const hasAchievements = achievements?.some(
                    a => a.achievement?.category === key
                  );
                  
                  if (!hasAchievements) return null;
                  
                  const CategoryIcon = category.icon;
                  
                  return (
                    <Button
                      key={key}
                      variant={selectedAchievementCategory === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedAchievementCategory(key)}
                      className="whitespace-nowrap"
                    >
                      <CategoryIcon className="h-4 w-4 mr-2" />
                      {category.title}
                    </Button>
                  );
                })}
              </div>
            </div>
            
            <AchievementDisplay 
              achievements={achievements || []} 
              filter={selectedAchievementCategory}
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a237e] to-[#0d1b3c] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a237e] to-[#0d1b3c] text-white">
      <div className="w-full relative">
        {/* Banner - replacing placeholder with a gradient background */}
        <div 
          className="w-full h-[200px] bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-800"
          style={{ 
            backgroundImage: profileData?.banner_url ? 
              `url('${profileData.banner_url}')` : 
              'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }} 
        />

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
                {profileData?.stream_id && (
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
                {profileData?.stream_title && (
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
                    <button
                      onClick={handleFollowToggle}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white font-medium transition"
                    >
                      {profileData?.is_following ? 'Unfollow' : 'Follow'}
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
      <div className="flex mb-6 border-b border-white/10 overflow-x-auto">
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
            activeTab === 'saved'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('saved')}
        >
          <Bookmark className="h-4 w-4" />
          Saved
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
      {renderTabContent()}
    </div>
  );
};

export default UserProfile;
