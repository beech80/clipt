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
import { format, formatDistanceToNow } from 'date-fns';
import '@/styles/profile-orange-retro.css';
import RetroProgressBar from '@/components/achievements/RetroProgressBar';

// Enhanced AchievementItem with progress bar
const AchievementItem = ({ name, desc, progress, target, completed }: { name: string; desc: string; progress?: number; target?: number; completed?: boolean }) => {
  const pct = progress !== undefined && target ? Math.round((progress / target) * 100) : completed ? 100 : 0;
  return (
    <div className="mb-2 px-4 py-3 bg-[#1a0e03] rounded-lg border-2 border-[#ff6600] shadow-orange-glow flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-xl">🏆</span>
        <span className="font-retro text-lg text-[#ff6600] drop-shadow-orange-glow">{name}</span>
      </div>
      <div className="text-orange-200 text-sm font-mono mt-1">{desc}</div>
      {typeof progress === 'number' && typeof target === 'number' && target > 1 && (
        <div className="mt-2">
          <RetroProgressBar value={pct} label={`${progress} / ${target}`} />
        </div>
      )}
      {completed && (!progress || !target) && (
        <div className="mt-2">
          <RetroProgressBar value={100} label="Completed!" />
        </div>
      )}
    </div>
  );
};

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
        if (!currentUserProfileId) {
          console.error("CRITICAL: No currentUserProfileId available");
          return;
        }

        console.log(`PROFILE DEBUG: Fetching ALL content for user ID: ${currentUserProfileId}`);
        
        // ======== EMERGENCY DIRECT USER POST CHECK ========
        // Direct database check - no filters that could block content
        const { data: rawUserPosts, error: rawPostsError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', currentUserProfileId)
          .limit(100);

        console.log(`DIRECT DB CHECK: Found ${rawUserPosts?.length || 0} total items for user ${currentUserProfileId}`, 
          rawUserPosts?.map(p => ({ id: p.id, type: p.post_type, content: p.content?.substring(0, 20) })));
        
        if (rawPostsError) {
          console.error('CRITICAL ERROR in direct DB query:', rawPostsError);
        }
        
        if (!rawUserPosts || rawUserPosts.length === 0) {
          console.log(`WARNING: No posts found for user ${currentUserProfileId} in direct DB check`);
        }

        // ======== FETCH POSTS WITH USER PROFILE DATA ========
        console.log(`Fetching posts for user ${currentUserProfileId} - including profile data`);
        const { data: postsWithProfiles, error: profilesError } = await supabase
          .from('posts')
          .select(`
            *,
            profiles:profiles(*)
          `)
          .eq('user_id', currentUserProfileId)
          .order('created_at', { ascending: false });
        
        if (profilesError) {
          console.error('Error fetching posts with profiles:', profilesError);
        } else {
          console.log(`Found ${postsWithProfiles?.length || 0} posts with profile data:`, 
            postsWithProfiles?.map(p => ({ 
              id: p.id, 
              type: p.post_type, 
              username: p.profiles?.username,
              hasProfileData: !!p.profiles 
            })));
        }

        // ======== SEPARATE POSTS AND CLIPS ========
        let postItems = [];
        let clipItems = [];
        
        if (postsWithProfiles && postsWithProfiles.length > 0) {
          postItems = postsWithProfiles.filter(item => item.post_type === 'post');
          clipItems = postsWithProfiles.filter(item => item.post_type === 'clip');
          
          console.log(`Filtered ${postItems.length} posts and ${clipItems.length} clips`);
        }

        // ======== FETCH SAVED POSTS ========
        let savedPostsData = [];
        if (user && user.id === currentUserProfileId) {
          // Get bookmark IDs first
          const { data: bookmarks, error: bookmarksError } = await supabase
            .from('bookmarks')
            .select('post_id')
            .eq('user_id', user.id);

          if (bookmarksError) {
            console.error('Error fetching bookmarks:', bookmarksError);
          } else if (bookmarks && bookmarks.length > 0) {
            const bookmarkIds = bookmarks.map(b => b.post_id);
            console.log(`Found ${bookmarkIds.length} bookmark IDs for current user`);
            
            // Fetch actual posts by those IDs
            const { data: savedPosts, error: savedPostsError } = await supabase
              .from('posts')
              .select(`
                *,
                profiles:profiles(*)
              `)
              .in('id', bookmarkIds)
              .order('created_at', { ascending: false });
              
            if (savedPostsError) {
              console.error('Error fetching saved posts:', savedPostsError);
            } else {
              savedPostsData = savedPosts || [];
              console.log(`Retrieved ${savedPostsData.length} saved posts`);
            }
          }
        }

        // ======== ADD USER LIKES INFO ========
        if (user) {
          const { data: userLikes, error: likesError } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', user.id);
            
          if (likesError) {
            console.error('Error fetching user likes:', likesError);
          } else {
            const likedPostIds = new Set((userLikes || []).map(like => like.post_id));
            console.log(`User has liked ${likedPostIds.size} posts`);
            
            // Process user like info into posts
            postItems = postItems.map(post => ({
              ...post,
              liked_by_current_user: likedPostIds.has(post.id),
              // Extract profile info to top level for easier access
              username: post.profiles?.username || 'Unknown',
              avatar_url: post.profiles?.avatar_url || null,
              display_name: post.profiles?.display_name || post.profiles?.username || 'User'
            }));
            
            clipItems = clipItems.map(clip => ({
              ...clip,
              liked_by_current_user: likedPostIds.has(clip.id),
              username: clip.profiles?.username || 'Unknown',
              avatar_url: clip.profiles?.avatar_url || null,
              display_name: clip.profiles?.display_name || clip.profiles?.username || 'User'
            }));
            
            savedPostsData = savedPostsData.map(post => ({
              ...post,
              liked_by_current_user: likedPostIds.has(post.id),
              username: post.profiles?.username || 'Unknown',
              avatar_url: post.profiles?.avatar_url || null,
              display_name: post.profiles?.display_name || post.profiles?.username || 'User'
            }));
          }
        }

        // Final debug check before setting state
        console.log('FINAL DATA SUMMARY:');
        console.log(`- Posts: ${postItems.length}`);
        console.log(`- Clips: ${clipItems.length}`);
        console.log(`- Saved: ${savedPostsData.length}`);
        
        // If we have raw posts but processed posts are empty, use raw posts as fallback
        if (rawUserPosts?.length > 0 && postItems.length === 0 && clipItems.length === 0) {
          console.log('EMERGENCY FALLBACK: Using raw posts data');
          
          // Simple separation of posts and clips from raw data
          const rawPostItems = rawUserPosts.filter(p => p.post_type === 'post');
          const rawClipItems = rawUserPosts.filter(p => p.post_type === 'clip');
          
          // Set these directly if we have no other option
          setPosts(rawPostItems);
          setClips(rawClipItems);
        } else {
          // Set the processed data with profile information
          setPosts(postItems);
          setClips(clipItems);
          setSavedPosts(savedPostsData);
        }
      } catch (error) {
        console.error('CRITICAL ERROR in fetchUserContent:', error);
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

  // Render posts grid in Madden 95 retro gaming style
  const renderPostsGrid = (postsToRender: Post[]) => {
    console.log(`Rendering grid with ${postsToRender?.length || 0} posts:`, 
      postsToRender?.map(p => ({ id: p.id, type: p.post_type, content: p.content?.substring(0, 20) || 'No content' })));
    
    if (!postsToRender || postsToRender.length === 0) {
      return (
        <div className="profile-empty-state flex flex-col items-center justify-center py-16 my-4 shadow-orange-glow">
          <FileText className="h-16 w-16 mb-6 text-[#ff6600] drop-shadow-orange-glow opacity-80" />
          
          {activeTab === 'posts' && (
            <div className="text-center max-w-md">
              <p className="text-xl font-semibold mb-2 font-retro text-[#ff6600] animate-pulse-slow">This user hasn't posted anything yet</p>
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
              <p className="text-xl font-semibold mb-2">No saved posts</p>
              <p className="text-gray-400">When you save posts, they'll appear here.</p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="py-4">
        {/* Classic Madden 95-style header */}
        <div className="bg-[#001133] border-2 border-[#4488cc] text-white font-bold uppercase text-center py-2 mb-4 rounded">
          {activeTab === 'posts' ? 'User Posts' : activeTab === 'clips' ? 'Video Clips' : 'Saved Content'}
        </div>
        
        {/* Debug counts */}
        <div className="text-xs text-gray-500 mb-2 font-mono">
          Debug: Found {postsToRender.length} items
        </div>
        
        {/* Grid layout with Madden 95 styling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {postsToRender.map(post => (
            <div
              key={post.id}
              className="bg-[#001133] border-4 border-[#4488cc] rounded-md overflow-hidden cursor-pointer transform transition hover:scale-[1.02] hover:shadow-lg"
              onClick={() => handlePostClick(post.id)}
            >
              <div className="relative">
                {/* Post media - with enhanced fallback handling */}
                <div className="bg-black aspect-video overflow-hidden relative">
                  {getPostMediaContent(post)}
                  
                  {/* Post type indicator */}
                </div>
                <div className="space-y-2">
                  {group.map((a, i) => (
                    <AchievementItem
                      key={a.achievement?.id || i}
                      name={a.achievement?.name || 'Achievement'}
                      desc={a.achievement?.description || ''}
                      progress={a.currentValue}
    if (post.video_url) {
      return (
        <div className="relative">
          <video
            src={post.video_url}
            className="w-full h-full object-cover"
            muted
            playsInline
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
              <Video className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      );
    }
    
    // Then try image_url
    if (post.image_url) {
      return (
        <img 
          src={post.image_url} 
          alt="Post content" 
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23001133'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%234488cc' text-anchor='middle' dominant-baseline='middle'%3EImage Error%3C/text%3E%3C/svg%3E";
          }}
        />
      );
    }
    
    // Try thumbnail_url
    if (post.thumbnail_url) {
      return (
        <img 
          src={post.thumbnail_url} 
          alt="Post thumbnail" 
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23001133'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%234488cc' text-anchor='middle' dominant-baseline='middle'%3EImage Error%3C/text%3E%3C/svg%3E";
          }}
        />
      );
    }
    
    // Try media_urls
    if (post.media_urls) {
      let mediaUrl = null;
      try {
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
        
        if (mediaUrl) {
          return (
            <img 
              src={mediaUrl} 
              alt="Post media" 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23001133'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%234488cc' text-anchor='middle' dominant-baseline='middle'%3EImage Error%3C/text%3E%3C/svg%3E";
              }}
            />
          );
        }
      } catch (error) {
        console.error("Error processing media URL for post:", post.id, error);
      }
    }
    
    // Fallback for text posts
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#001133] to-[#001b3d]">
        <FileText className="h-10 w-10 text-[#4488cc]" />
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
            <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-8">
              {/* Trophy & Weekly Top 10 Achievements */}
              <div>
                <div className="text-2xl font-retro text-[#ff6600] mb-3 border-b-2 border-[#ff6600] pb-1 drop-shadow-orange-glow flex items-center">🏆 Trophy & Weekly Top 10 Achievements</div>
                <AchievementItem name="First Taste of Gold" desc="Earn 10 trophies on a single post." />
                <AchievementItem name="Crowd Favorite" desc="Get 50 trophies on a post." />
                <AchievementItem name="Viral Sensation" desc="Reach 100 trophies on a single post." />
                <AchievementItem name="Content King" desc="Earn 500 trophies on a post." />
                <AchievementItem name="Clipt Icon" desc="Reach 1,000 trophies on a post—true viral status." />
                <AchievementItem name="Breaking In" desc="Rank in the Top 10 of the weekly leaderboard for the first time." />
                <AchievementItem name="Back-to-Back" desc="Stay in the Top 10 for 2 consecutive weeks." />
                <AchievementItem name="Hot Streak" desc="Maintain a Top 10 spot for 5 weeks straight." />
                <AchievementItem name="Unstoppable" desc="Stay in the Top 10 for 10 consecutive weeks." />
                <AchievementItem name="Clipt Hall of Fame" desc="Rank in the Top 10 for 25 weeks total." />
              </div>
              {/* Follower Achievements */}
              <div>
                <div className="text-2xl font-retro text-[#ff6600] mb-3 border-b-2 border-[#ff6600] pb-1 drop-shadow-orange-glow flex items-center">📈 Follower Achievements</div>
                <AchievementItem name="Rising Star" desc="Hit 1,000 followers on Clipt." />
                <AchievementItem name="Trending Now" desc="Reach 5,000 followers—people love your content." />
                <AchievementItem name="Influencer Status" desc="Gain 10,000 followers and grow your community." />
                <AchievementItem name="Clipt Famous" desc="Surpass 50,000 followers—your name is known." />
                <AchievementItem name="Elite Creator" desc="Reach 100,000 followers and be among the platform’s best." />
              </div>
              {/* Streaming Subscriber Achievements */}
              <div>
                <div className="text-2xl font-retro text-[#ff6600] mb-3 border-b-2 border-[#ff6600] pb-1 drop-shadow-orange-glow flex items-center">🎥 Streaming Subscriber Achievements</div>
                <AchievementItem name="First Supporter" desc="Gain your first subscriber on your streaming channel." />
                <AchievementItem name="Small but Mighty" desc="Hit 10 subscribers—your community is growing." />
                <AchievementItem name="Streaming Star" desc="Reach 100 subscribers—your audience is loyal." />
                <AchievementItem name="Big League Streamer" desc="Gain 1,000 subscribers and solidify your name." />
                <AchievementItem name="Streaming Legend" desc="Surpass 10,000 subscribers—you’re a household name." />
              </div>
              {/* Engagement Booster Achievements */}
              <div>
                <div className="text-2xl font-retro text-[#ff6600] mb-3 border-b-2 border-[#ff6600] pb-1 drop-shadow-orange-glow flex items-center">1️⃣ Engagement Booster Achievements</div>
                <AchievementItem name="Hype Squad" desc="Leave 50 comments on other creators’ posts." />
                <AchievementItem name="Super Supporter" desc="Give out 100 trophies to different posts." />
                <AchievementItem name="Engagement Master" desc="Your comments have 1,000 total likes." />
                <AchievementItem name="Conversation Starter" desc="Get 100 replies to your comments." />
                <AchievementItem name="Community Builder" desc="Start a trending discussion (a post with 500+ comments)." />
              </div>
              {/* Sharing & Promotion Achievements */}
              <div>
                <div className="text-2xl font-retro text-[#ff6600] mb-3 border-b-2 border-[#ff6600] pb-1 drop-shadow-orange-glow flex items-center">2️⃣ Sharing & Promotion Achievements</div>
                <AchievementItem name="Signal Booster" desc="Share 10 posts from other creators." />
                <AchievementItem name="Clipt Evangelist" desc="Invite 5 friends who create an account." />
                <AchievementItem name="The Connector" desc="Tag 100 different users in posts or comments." />
                <AchievementItem name="Trendsetter" desc="A post you shared helps another user reach Top 10 for the week." />
                <AchievementItem name="Algorithm Whisperer" desc="Share a post that reaches 10,000+ views within 24 hours." />
              </div>
              {/* Collab & Creator Support Achievements */}
              <div>
                <div className="text-2xl font-retro text-[#ff6600] mb-3 border-b-2 border-[#ff6600] pb-1 drop-shadow-orange-glow flex items-center">3️⃣ Collab & Creator Support Achievements</div>
                <AchievementItem name="Duo Dynamic" desc="Collaborate on a post with another creator that gets 50+ trophies." />
                <AchievementItem name="Mentor Mode" desc="Shout out a smaller creator (under 500 followers) and help them grow to 1,000+." />
                <AchievementItem name="The Networker" desc="Get tagged in 100 different posts by other creators." />
                <AchievementItem name="Creator Spotlight" desc="Your engagement helps three different creators break into the weekly Top 10." />
                <AchievementItem name="Industry Connector" desc="Get featured in a major gaming or streaming-related article." />
              </div>
              {/* Hidden & Special Achievements */}
              <div>
                <div className="text-2xl font-retro text-[#ff6600] mb-3 border-b-2 border-[#ff6600] pb-1 drop-shadow-orange-glow flex items-center">4️⃣ Hidden & Special Achievements</div>
                <AchievementItem name="OG Clipt Creator" desc="Join Clipt within the first 3 months of launch." />
                <AchievementItem name="Day One Grinder" desc="Upload a post on launch day." />
                <AchievementItem name="Mystery Viral" desc="A random old post of yours goes viral again after 30+ days." />
                <AchievementItem name="Shadow Supporter" desc="Consistently like and comment on another creator’s posts for a month." />
                <AchievementItem name="The Legend of Clipt" desc="Your name is mentioned 1,000+ times in posts or comments." />
              </div>
            </div>
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
    <div className="min-h-screen bg-gradient-to-b from-[#18120b] via-[#332012] to-[#1a0900] text-white">
      <div className="w-full relative">
        {/* Banner - replacing placeholder with a gradient background */}
        <div 
          className="w-full h-[200px] bg-gradient-to-r from-[#ff6600] via-[#ff9900] to-[#ff6600] shadow-lg shadow-orange-900/40"
          style={{ 
            backgroundImage: profileData?.banner_url ? 
              `linear-gradient(90deg, #ff6600 0%, #ff9900 50%, #ff6600 100%), url('${profileData.banner_url}')` : 
              'linear-gradient(90deg, #ff6600 0%, #ff9900 100%)',
            backgroundBlendMode: profileData?.banner_url ? 'multiply, normal' : 'normal',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }} 
        />

        {/* Profile info */}
        <div className="container mx-auto px-4 relative -mt-24">
          <div className="profile-retro-glass-card bg-[#18120b]/70 backdrop-blur-xl rounded-2xl p-8 border-4 border-[#ff6600] shadow-[0_0_40px_#ff6600bb,0_0_0_8px_#1a0e03] max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-center md:items-start">
            {/* Avatar */}
            <div className="relative flex flex-col items-center">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-8 border-[#ff9900] shadow-[0_0_48px_#ff6600cc,0_0_0_12px_#1a0e03] bg-gradient-to-br from-[#ff6600] to-[#1a0e03]">
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
                <div className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold rounded-full px-3 py-1 flex items-center gap-1 shadow-lg animate-pulse">
                  <span className="rounded-full h-2 w-2 bg-white mr-1"></span>
                  LIVE
                </div>
              )}
            </div>
            {/* User info and stats */}
            <div className="flex-1 flex flex-col gap-4 items-center md:items-start">
              <h1 className="text-4xl md:text-5xl font-extrabold text-[#ff6600] drop-shadow-orange-glow font-retro px-4 py-2 rounded-xl bg-[#1a0e03]/60 border-2 border-[#ff9900] shadow-[0_0_12px_#ff6600bb] text-center md:text-left">
                {profileData?.display_name || profileData?.username}
              </h1>
              <p className="text-[#ff9900] text-lg mb-2 bg-[#1a0900]/80 px-3 py-1 rounded font-mono text-center md:text-left">@{profileData?.username}</p>
              {profileData?.stream_title && (
                <div className="mb-2 bg-red-500/20 rounded-md p-2 border border-red-500/30">
                  <p className="font-semibold text-black">Currently streaming: <span className="bg-gray-100 px-2 py-1 rounded inline-block">{profileData.stream_title}</span></p>
                  <p className="text-sm">{profileData?.stream_id} viewers</p>
                </div>
              )}
              <p className="text-base md:text-lg whitespace-pre-wrap text-black bg-gray-100/70 p-3 rounded-xl mt-2 w-full max-w-xl text-center md:text-left">{profileData?.bio || ""}</p>
              {/* Stats and buttons */}
              <div className="flex flex-col md:flex-row gap-4 w-full items-center md:items-end justify-between mt-4">
                <div className="flex gap-8 text-center">
                  <div>
                    <div className="text-3xl font-extrabold text-[#ffb347] drop-shadow-orange-glow">{posts.length + clips.length}</div>
                    <div className="text-orange-200 text-base font-retro">Posts</div>
                  </div>
                  <div>
                    <div className="text-3xl font-extrabold text-[#ffb347] drop-shadow-orange-glow">{profileData?.followers_count || 0}</div>
                    <div className="text-orange-200 text-base font-retro">Followers</div>
                  </div>
                  <div>
                    <div className="text-3xl font-extrabold text-[#ffb347] drop-shadow-orange-glow">{profileData?.following_count || 0}</div>
                    <div className="text-orange-200 text-base font-retro">Following</div>
                  </div>
                </div>
                <div className="flex gap-3 mt-4 md:mt-0 justify-center">
                  {user && user.id === profileData?.id ? (
                    <button
                      onClick={() => navigate("/settings")}
                      className="px-6 py-2 bg-[#ff6600] hover:bg-[#ff9900] rounded-lg text-white font-bold shadow-orange-glow transition font-retro tracking-wider border-2 border-orange-700 focus:outline-none focus:ring-2 focus:ring-[#ff9900] active:scale-95 text-lg"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleFollowToggle}
                        className="px-6 py-2 bg-[#ff6600] hover:bg-[#ff9900] rounded-lg text-white font-bold shadow-orange-glow transition font-retro tracking-wider border-2 border-orange-700 focus:outline-none focus:ring-2 focus:ring-[#ff9900] active:scale-95 text-lg"
                      >
                        {profileData?.is_following ? 'Unfollow' : 'Follow'}
                      </button>
                      <button
                        className="px-6 py-2 bg-transparent border-2 border-orange-500 hover:bg-orange-500/20 rounded-lg text-[#ff6600] font-bold font-retro transition text-lg"
                        onClick={() => navigate(`/messages/new/${profileData?.id}`)}
                      >
                        Message
                      </button>
                    </>
                  )}
                  <button className="px-6 py-2 bg-transparent border-2 border-orange-500 hover:bg-orange-500/20 rounded-lg text-[#ff6600] font-bold font-retro transition text-lg">
                    Share Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
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
                <h1 className="text-2xl md:text-3xl font-bold text-[#ff6600] drop-shadow-orange-glow font-retro px-3 py-1 rounded animate-pulse-slow">{profileData?.display_name || profileData?.username}</h1>
                <p className="text-[#ff9900] mb-2 bg-[#1a0900]/80 px-2 py-1 rounded inline-block font-mono">@{profileData?.username}</p>

                {/* Stream title if streaming */}
                {profileData?.stream_title && (
                  <div className="mb-3 bg-red-500/20 rounded-md p-2 border border-red-500/30">
                    <p className="font-semibold text-black">Currently streaming: <span className="bg-gray-100 px-2 py-1 rounded inline-block">{profileData.stream_title}</span></p>
                    <p className="text-sm">{profileData?.stream_id} viewers</p>
                  </div>
                )}

                <p className="text-sm md:text-base whitespace-pre-wrap text-black bg-gray-100/70 p-2 rounded mt-2">{profileData?.bio || ""}</p>

                <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
                  {/* Edit profile button when viewing own profile */}
                  {user && user.id === profileData?.id ? (
                    <button
                      onClick={() => navigate("/settings")}
                      className="px-4 py-2 bg-[#ff6600] hover:bg-[#ff9900] rounded-lg text-white font-bold shadow-orange-glow transition font-retro tracking-wider border-2 border-orange-700 focus:outline-none focus:ring-2 focus:ring-[#ff9900] active:scale-95"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <>
                      {/* Follow button when viewing someone else's profile */}
                      <button
                        onClick={handleFollowToggle}
                        className="px-4 py-2 bg-[#ff6600] hover:bg-[#ff9900] rounded-lg text-white font-bold shadow-orange-glow transition font-retro tracking-wider border-2 border-orange-700 focus:outline-none focus:ring-2 focus:ring-[#ff9900] active:scale-95"
                      >
                        {profileData?.is_following ? 'Unfollow' : 'Follow'}
                      </button>
                      
                      {/* Message button when viewing someone else's profile */}
                      <button 
                        className="px-4 py-2 bg-[#ff6600] hover:bg-[#ff9900] rounded-lg text-white font-bold shadow-orange-glow transition font-retro tracking-wider border-2 border-orange-700 focus:outline-none focus:ring-2 focus:ring-[#ff9900] active:scale-95"
                        className="px-4 py-2 bg-transparent border border-orange-500 hover:bg-orange-500/20 rounded-md text-[#ff6600] font-bold transition"
                        onClick={() => navigate(`/messages/new/${profileData?.id}`)}
                      >
                        Message
                      </button>
                    </>
                  )}

                  {/* Share profile button - always shown */}
                  <button className="px-4 py-2 bg-transparent border border-orange-500 hover:bg-orange-500/20 rounded-md text-[#ff6600] font-bold transition">
                    Share Profile
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 text-center mt-4 md:mt-0 text-orange-400">
                <div>
                  <div className="text-xl font-bold">
                    {posts.length + clips.length}
                  </div>
                  <div className="text-orange-300 text-sm">Posts</div>
                </div>
                <div>
                  <div className="text-xl font-bold">{profileData?.followers_count || 0}</div>
                  <div className="text-orange-300 text-sm">Followers</div>
                </div>
                <div>
                  <div className="text-xl font-bold">{profileData?.following_count || 0}</div>
                  <div className="text-orange-300 text-sm">Following</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex mb-6 border-b border-white/10 overflow-x-auto">
        <button
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold font-mono tracking-wide transition-all duration-150 ${
            activeTab === 'posts'
              ? 'text-[#ff6600] border-b-2 border-[#ff6600] bg-orange-900/10 shadow-orange-glow'
              : 'text-orange-200 hover:text-[#ff9900] hover:bg-orange-900/10'
          }`}
          onClick={() => setActiveTab('posts')}
        >
          <Grid className="h-4 w-4 text-[#ff6600] drop-shadow-orange-glow" />
          Posts
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold font-mono tracking-wide transition-all duration-150 ${
            activeTab === 'clips'
              ? 'text-[#ff6600] border-b-2 border-[#ff6600] bg-orange-900/10 shadow-orange-glow'
              : 'text-orange-200 hover:text-[#ff9900] hover:bg-orange-900/10'
          }`}
          onClick={() => setActiveTab('clips')}
        >
          <ListVideo className="h-4 w-4 text-[#ff6600] drop-shadow-orange-glow" />
          Clipts
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold font-mono tracking-wide transition-all duration-150 ${
            activeTab === 'saved'
              ? 'text-[#ff6600] border-b-2 border-[#ff6600] bg-orange-900/10 shadow-orange-glow'
              : 'text-orange-200 hover:text-[#ff9900] hover:bg-orange-900/10'
          }`}
          onClick={() => setActiveTab('saved')}
        >
          <Bookmark className="h-4 w-4 text-[#ff6600] drop-shadow-orange-glow" />
          Saved
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold font-mono tracking-wide transition-all duration-150 ${
            activeTab === 'achievements'
              ? 'text-[#ff6600] border-b-2 border-[#ff6600] bg-orange-900/10 shadow-orange-glow'
              : 'text-orange-200 hover:text-[#ff9900] hover:bg-orange-900/10'
          }`}
          onClick={() => setActiveTab('achievements')}
        >
          <Trophy className="h-4 w-4 text-[#ff6600] drop-shadow-orange-glow" />
          Trophies
        </button>
      </div>

      {/* Content Area */}
      {renderTabContent()}
    </div>
  );
};

export default UserProfile;
