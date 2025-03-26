import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { User, Settings, Grid, ListVideo, Trophy, Loader2, Video, RefreshCw } from 'lucide-react';
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
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [clips, setClips] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id || user?.id)
        .single();
      
      if (profileError) throw profileError;
      
      // Check if the current user is following this profile
      let isFollowing = false;
      if (user && user.id !== (id || user.id)) {
        isFollowing = await followService.isFollowing(user.id, id || user.id);
      }
      
      // Fetch followers count
      const followersCount = await followService.getFollowersCount(id || user?.id);
      
      // Fetch following count
      const followingCount = await followService.getFollowingCount(id || user?.id);
      
      // Check if the user is currently streaming
      const { data: streamData, error: streamError } = await supabase
        .from('active_streams')
        .select('id, title, viewer_count, started_at')
        .eq('user_id', id || user?.id)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();
      
      const isStreaming = !!streamData && !streamError;
      
      const targetUserId = id || user?.id;
      console.log("Fetching posts for user ID:", targetUserId);
      
      // Direct query to get all posts from this user - no filtering by post_type
      const { data: allPostsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });
      
      if (postsError) {
        console.error("Error fetching posts:", postsError);
        toast.error('Failed to load posts');
      } else {
        console.log("Fetched total posts:", allPostsData?.length || 0);
        
        // Even if post_type doesn't exist, include the post in regularPosts
        const regularPosts = allPostsData?.filter(post => {
          return post.post_type === 'post' || !post.post_type || post.post_type === '';
        }) || [];
        
        const cliptPosts = allPostsData?.filter(post => post.post_type === 'clipt') || [];
        
        console.log("Regular posts:", regularPosts.length, "Clipt posts:", cliptPosts.length);
        
        // Update state with the posts
        setPosts(regularPosts);
        setClips(cliptPosts);
      }
      
      // Set profile data
      setProfileData({
        id: profileData.id,
        username: profileData.username,
        display_name: profileData.display_name,
        avatar_url: profileData.avatar_url,
        banner_url: profileData.banner_url,
        bio: profileData.bio,
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
    fetchProfileData();
  }, [id, user]);

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
        console.log("Rendering posts tab, posts available:", posts.length);
        
        if (loading) {
          return (
            <div className="flex flex-col items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-2" />
              <p className="text-gray-400">Loading posts...</p>
            </div>
          );
        }
        
        return posts.length > 0 ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-white font-medium">All Posts</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-400 hover:text-white"
                onClick={fetchProfileData}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map((post) => {
                // Parse media URLs if they're stored as JSON string
                let mediaUrls = post.media_urls || [];
                if (typeof mediaUrls === 'string') {
                  try {
                    mediaUrls = JSON.parse(mediaUrls);
                  } catch (e) {
                    console.error("Error parsing media URLs:", e);
                    mediaUrls = [];
                  }
                }
                
                // Debug info for this post
                console.log(`Post ${post.id}:`, {
                  caption: post.caption,
                  mediaUrls: mediaUrls,
                  thumbnail: post.thumbnail_url
                });
                
                return (
                  <div 
                    key={post.id} 
                    className="bg-black/30 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10 cursor-pointer hover:border-purple-500/50 transition-colors"
                    onClick={() => navigate(`/post/${post.id}`)}
                  >
                    <div className="aspect-video bg-gray-800 flex items-center justify-center">
                      {mediaUrls && mediaUrls.length > 0 ? (
                        <img 
                          src={mediaUrls[0]} 
                          alt={post.caption || 'Post thumbnail'} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://placehold.co/600x400/1a237e/ffffff?text=Post';
                          }}
                        />
                      ) : post.thumbnail_url ? (
                        <img 
                          src={post.thumbnail_url} 
                          alt={post.caption || 'Post thumbnail'} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://placehold.co/600x400/1a237e/ffffff?text=Post';
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full w-full bg-gray-900">
                          <p className="text-gray-400 text-sm">{post.caption || 'No Thumbnail'}</p>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-white text-sm font-medium truncate">{post.caption || 'Untitled'}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-gray-400 text-xs">{post.likes_count || 0} likes</p>
                        <p className="text-gray-400 text-xs">{post.comments_count || 0} comments</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <p>No posts available</p>
            {user && user.id === profileData?.id && (
              <Button 
                className="mt-4 bg-purple-600 hover:bg-purple-700"
                onClick={() => navigate('/post/new')}
              >
                Create your first post
              </Button>
            )}
          </div>
        );
      
      case 'clips':
        return clips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clips.map((clip) => {
              // Parse media URLs if they're stored as JSON string
              let mediaUrls = clip.media_urls || [];
              if (typeof mediaUrls === 'string') {
                try {
                  mediaUrls = JSON.parse(mediaUrls);
                } catch (e) {
                  console.error("Error parsing media URLs:", e);
                  mediaUrls = [];
                }
              }
              
              return (
                <div 
                  key={clip.id} 
                  className="bg-black/30 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10 cursor-pointer hover:border-purple-500/50 transition-colors"
                  onClick={() => navigate(`/post/${clip.id}`)}
                >
                  <div className="aspect-video bg-gray-800 flex items-center justify-center relative">
                    {mediaUrls.length > 0 ? (
                      <>
                        <video 
                          src={mediaUrls[0]} 
                          className="w-full h-full object-cover"
                          poster={clip.thumbnail_url}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-14 w-14 bg-purple-600/70 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                          </div>
                        </div>
                      </>
                    ) : clip.thumbnail_url ? (
                      <img 
                        src={clip.thumbnail_url} 
                        alt={clip.caption || 'Clip thumbnail'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full bg-gray-900">
                        <p className="text-gray-400 text-sm">No Video</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-white text-sm font-medium truncate">{clip.caption || 'Untitled'}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-gray-400 text-xs">{clip.likes_count || 0} likes</p>
                      <p className="text-gray-400 text-xs">{clip.comments_count || 0} comments</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <p>No clips available</p>
            {user && user.id === profileData?.id && (
              <Button 
                className="mt-4 bg-purple-600 hover:bg-purple-700"
                onClick={() => navigate('/post/new?type=clipt')}
              >
                Create your first clip
              </Button>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a237e] to-[#0d1b3c] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a237e] to-[#0d1b3c]">
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black/40 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-center max-w-7xl mx-auto relative">
          <BackButton />
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <User className="text-purple-400" size={24} />
            Profile
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-24 pb-20 max-w-2xl">
        {/* Live Stream Display (shown only if user is streaming) */}
        {profileData?.is_streaming && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-red-500 hover:bg-red-600 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
                  LIVE
                </Badge>
                <h2 className="text-white font-semibold text-lg">{profileData.stream_title || `${profileData.username}'s stream`}</h2>
              </div>
              <Button 
                variant="default" 
                className="bg-red-600 hover:bg-red-700"
                onClick={() => navigate(`/stream/${profileData.stream_id || profileData.id}`)}
              >
                Watch Full Screen
              </Button>
            </div>
            <div 
              className="relative cursor-pointer" 
              onClick={() => navigate(`/stream/${profileData.stream_id || profileData.id}`)}
            >
              <StreamPlayer 
                streamId={profileData.stream_id || profileData.id}
                title={profileData.stream_title || `${profileData.username}'s stream`}
                isLive={true}
              />
              <div className="absolute inset-0 bg-transparent hover:bg-black/20 transition-colors flex items-center justify-center">
                <div className="bg-black/70 p-2 rounded-full opacity-0 hover:opacity-100 transition-opacity">
                  <Video className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-black/30 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 shadow-xl mb-6">
          {/* Banner */}
          <div className="h-40 relative">
            {profileData?.banner_url ? (
              <img 
                src={profileData.banner_url} 
                alt="Profile banner" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="h-40 bg-gradient-to-r from-indigo-500/30 to-purple-500/30" />
            )}
            
            {/* Avatar */}
            <div className="absolute -bottom-12 left-6">
              <Avatar className="w-24 h-24 border-4 border-[#0d1b3c]">
                <AvatarImage src={profileData?.avatar_url || ''} />
                <AvatarFallback className="bg-purple-600 text-white text-2xl font-bold">
                  {profileData?.display_name?.charAt(0) || profileData?.username?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
            </div>
            
            {/* Live Indicator (shown when user is streaming) */}
            {profileData?.is_streaming && (
              <div className="absolute bottom-4 left-[104px]">
                <Badge className="bg-red-500 hover:bg-red-600 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
                  LIVE
                </Badge>
              </div>
            )}
            
            {/* Edit button (only show if it's the user's own profile) */}
            {user && user.id === profileData?.id && (
              <div className="absolute top-4 right-4">
                <Button 
                  onClick={() => navigate('/profile/edit')} 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2 bg-[#1a1b4b] border border-white/10 text-white hover:bg-[#272a5b] px-4 py-1 rounded-sm"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Button>
              </div>
            )}
          </div>
          
          {/* Profile Info */}
          <div className="pt-14 px-6 pb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">
                  {profileData?.display_name || profileData?.username || 'User'}
                </h2>
                <p className="text-gray-400 text-sm mb-4">@{profileData?.username || 'username'}</p>
                {profileData?.bio && (
                  <p className="text-gray-200 text-sm mb-4">{profileData.bio}</p>
                )}
              </div>
              
              {/* Follow button (only show if it's not the user's own profile) */}
              {user && user.id !== profileData?.id && (
                <Button 
                  onClick={handleFollowToggle} 
                  variant={profileData?.is_following ? "outline" : "default"}
                  className={profileData?.is_following ? 
                    "bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-500/10" : 
                    "bg-purple-600 hover:bg-purple-700"
                  }
                  disabled={followLoading}
                >
                  {followLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {profileData?.is_following ? 'Following' : 'Follow'}
                </Button>
              )}
            </div>
            
            {/* User stats */}
            <div className="flex gap-6 mt-4">
              <div className="text-center">
                <p className="text-white font-bold">{profileData?.followers_count || 0}</p>
                <p className="text-gray-400 text-sm">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-white font-bold">{profileData?.following_count || 0}</p>
                <p className="text-gray-400 text-sm">Following</p>
              </div>
              <div className="text-center">
                <p className="text-white font-bold">{achievements.length || 0}</p>
                <p className="text-gray-400 text-sm">Achievements</p>
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
    </div>
  );
};

export default UserProfile;
