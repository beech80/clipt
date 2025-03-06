import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { User, Settings, Grid, ListVideo, Trophy, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { followService } from '@/services/followService';
import { toast } from 'sonner';

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
      
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', id || user?.id)
        .eq('post_type', 'post')
        .order('created_at', { ascending: false });
      
      if (postsError) throw postsError;
      
      // Fetch clips
      const { data: clipsData, error: clipsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', id || user?.id)
        .eq('post_type', 'clipt')
        .order('created_at', { ascending: false });
      
      if (clipsError) throw clipsError;
      
      // Set data
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
        is_following: isFollowing
      });
      
      setPosts(postsData || []);
      setClips(clipsData || []);
      
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
        return posts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {posts.map((post) => (
              <div 
                key={post.id} 
                className="bg-black/30 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10 cursor-pointer hover:border-purple-500/50 transition-colors"
                onClick={() => navigate(`/post/${post.id}`)}
              >
                <div className="aspect-video bg-gray-800 flex items-center justify-center">
                  {post.media_urls && post.media_urls[0] ? (
                    <img 
                      src={post.media_urls[0]} 
                      alt={post.caption || 'Post thumbnail'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <p className="text-gray-400 text-sm">No Thumbnail</p>
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
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-gray-400">
            No posts available
          </div>
        );
      case 'clips':
        return clips.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {clips.map((clip) => (
              <div 
                key={clip.id} 
                className="bg-black/30 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10 cursor-pointer hover:border-purple-500/50 transition-colors"
                onClick={() => navigate(`/post/${clip.id}`)}
              >
                <div className="aspect-video bg-gray-800 flex items-center justify-center">
                  {clip.media_urls && clip.media_urls[0] ? (
                    <video 
                      src={clip.media_urls[0]} 
                      className="w-full h-full object-cover"
                      poster={clip.thumbnail_url}
                    />
                  ) : (
                    <p className="text-gray-400 text-sm">No Video</p>
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
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-gray-400">
            No clips available
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
                  size="sm"
                  className={`px-4 py-1 rounded-sm ${
                    profileData?.is_following 
                      ? "bg-transparent border border-purple-500 text-purple-500 hover:bg-purple-500/10" 
                      : "bg-purple-600 text-white hover:bg-purple-700"
                  }`}
                  disabled={followLoading}
                >
                  {followLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {profileData?.is_following ? 'Following' : 'Follow'}
                </Button>
              )}
            </div>
            
            {/* Stats */}
            <div className="flex gap-6 mt-4">
              <div>
                <p className="text-white font-bold">{profileData?.followers_count || 0}</p>
                <p className="text-gray-400 text-sm">Followers</p>
              </div>
              <div>
                <p className="text-white font-bold">{profileData?.following_count || 0}</p>
                <p className="text-gray-400 text-sm">Following</p>
              </div>
              <div>
                <p className="text-white font-bold">{profileData?.achievements_count || 0}</p>
                <p className="text-gray-400 text-sm">Trophies</p>
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
