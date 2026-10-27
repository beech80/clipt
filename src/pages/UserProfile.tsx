import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { User, Settings, Grid, ListVideo, Trophy, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { followService } from '@/services/followService';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import { publicProfileFields } from '@/lib/profile-fields';
import AchievementList from '@/components/achievements/AchievementList';
import ProfilePostTile from '@/components/profile/ProfilePostTile';
import ProfileConnectionsDialog from '@/components/profile/ProfileConnectionsDialog';
import type { ConnectionKind } from '@/lib/profile-connections';
import { BlockUserButton } from '@/components/BlockUserButton';
import { MuteUserButton } from '@/components/profile/MuteUserButton';
type ProfilePost = Tables<'posts'> & { likes: { count: number }[]; comments: { count: number }[] };

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
  const userId = user?.id;
  const [activeTab, setActiveTab] = useState('posts');
  const [connections, setConnections] = useState<ConnectionKind | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRevision = useRef(0);
  const followBusy = useRef(false);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [clips, setClips] = useState<ProfilePost[]>([]);

  const fetchProfileData = useCallback(async () => {
    const revision = ++requestRevision.current;
    try {
      setLoading(true);
      setError(null);
      const profileId = id || userId;
      if (!profileId) throw new Error('Choose a profile to view.');
      
      // Fetch user profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(publicProfileFields)
        .eq('id', profileId)
        .single();
      
      if (profileError) throw profileError;
      
      // Check if the current user is following this profile
      let isFollowing = false;
      if (userId && userId !== profileId) {
        const {data, error} = await supabase.from('follows').select('follower_id').eq('follower_id', userId).eq('following_id', profileId).maybeSingle();
        if (error) throw error;
        isFollowing = Boolean(data);
      }
      
      // Fetch followers count
      const [followers, following] = await Promise.all([
        supabase.from('follows').select('follower_id', {count:'exact', head:true}).eq('following_id', profileId),
        supabase.from('follows').select('follower_id', {count:'exact', head:true}).eq('follower_id', profileId),
      ]);
      if (followers.error) throw followers.error;
      if (following.error) throw following.error;
      const followersCount = followers.count ?? 0;
      const followingCount = following.count ?? 0;
      
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*, likes(count), comments(count)')
        .eq('user_id', profileId)
        .eq('post_type', 'post')
        .order('created_at', { ascending: false });
      
      if (postsError) throw postsError;
      
      // Fetch clips
      const { data: clipsData, error: clipsError } = await supabase
        .from('posts')
        .select('*, likes(count), comments(count)')
        .eq('user_id', profileId)
        .eq('post_type', 'clipt')
        .order('created_at', { ascending: false });
      
      if (clipsError) throw clipsError;
      
      if (revision !== requestRevision.current) return;
      // Set data only from confirmed requests for the current profile.
      setProfileData({
        id: profileData.id,
        username: profileData.username,
        display_name: profileData.display_name,
        avatar_url: profileData.avatar_url,
        bio: profileData.bio,
        followers_count: followersCount,
        following_count: followingCount,
        is_following: isFollowing
      });
      
      setPosts(postsData || []);
      setClips(clipsData || []);
      
    } catch (error) {
      console.error('Error fetching profile data:', error);
      if (revision === requestRevision.current) setError('This profile could not be loaded or is not available to you.');
    } finally {
      if (revision === requestRevision.current) setLoading(false);
    }
  }, [id, userId]);

  useEffect(() => {
    void fetchProfileData();
    return () => { requestRevision.current += 1; };
  }, [fetchProfileData]);

  const handleFollowToggle = async () => {
    if (!user || !profileData || followBusy.current) return;
    followBusy.current = true;
    
    try {
      setFollowLoading(true);
      
      if (profileData.is_following) {
        if (!await followService.unfollow(user.id, profileData.id)) throw new Error('Unfollow was not confirmed');
        setProfileData(prev => prev?.id === profileData.id ? {
          ...prev,
          is_following: false,
          followers_count: Math.max(0, (prev.followers_count || 0) - 1)
        } : prev);
        toast.success(`Unfollowed @${profileData.username}`);
      } else {
        if (!await followService.follow(user.id, profileData.id)) throw new Error('Follow was not confirmed');
        setProfileData(prev => prev?.id === profileData.id ? {
          ...prev,
          is_following: true,
          followers_count: (prev.followers_count || 0) + 1
        } : prev);
        toast.success(`Following @${profileData.username}`);
      }
      
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
    } finally {
      followBusy.current = false;
      setFollowLoading(false);
    }
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'posts':
        return posts.length > 0 ? (
          <div className="clipt-profile-grid">
            {posts.map((post) => (
              <ProfilePostTile key={post.id} post={post} likes={post.likes[0]?.count ?? 0} comments={post.comments[0]?.count ?? 0} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-gray-400">
            No posts available
          </div>
        );
      case 'clips':
        return clips.length > 0 ? (
          <div className="clipt-profile-grid">
            {clips.map((clip) => (
              <ProfilePostTile key={clip.id} post={clip} likes={clip.likes[0]?.count ?? 0} comments={clip.comments[0]?.count ?? 0} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-gray-400">
            No clips available
          </div>
        );
      case 'achievements':
        return (
          <AchievementList userId={profileData!.id} />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div role="status" aria-label="Loading profile" className="clipt-auth min-h-64 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  if (error || !profileData) return <main className="mx-auto max-w-xl p-6"><BackButton /><section role="alert" className="gaming-card p-6 space-y-4"><h1 className="text-xl font-semibold">Profile unavailable</h1><p>{error || 'This profile was not found.'}</p><Button onClick={() => void fetchProfileData()}>Retry profile</Button></section></main>;

  return (
    <main className="clipt-profile mx-auto max-w-6xl px-4 py-6">
      <div className="clipt-creator-heading p-4 border-b border-purple-500/40">
        <div className="flex items-center justify-center max-w-7xl mx-auto relative">
          <BackButton />
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <User className="text-purple-400" size={24} />
            Profile
          </h1>
        </div>
      </div>

      <div className="mx-auto pt-5 pb-6">
        {/* Profile Header */}
        <div className="clipt-profile-header clipt-creator-header gaming-card overflow-hidden mb-6">
          {/* Banner */}
          <div className="clipt-creator-banner h-40 relative">
            {profileData?.banner_url ? (
              <img 
                src={profileData.banner_url} 
                alt="Profile banner" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="clipt-profile-brand-banner h-40" aria-hidden="true" />
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
                  <span>Edit Profile</span>
                </Button>
              </div>
            )}
          </div>
          
          {/* Profile Info */}
          <div className="clipt-creator-info pt-14 px-6 pb-6">
            <div className="flex flex-wrap justify-between items-start gap-3">
              <div className="min-w-0 basis-full">
                <h2 className="text-xl font-bold text-white mb-1 [overflow-wrap:anywhere]">
                  {profileData?.display_name || profileData?.username || 'User'}
                </h2>
                <p className="text-gray-300 text-sm mb-4 [overflow-wrap:anywhere]">@{profileData.username}</p>
                {profileData?.bio && (
                  <p className="text-gray-200 text-sm mb-4 [overflow-wrap:anywhere]">{profileData.bio}</p>
                )}
              </div>
              
              {/* Follow button (only show if it's not the user's own profile) */}
              <BlockUserButton key={`${user?.id}:${profileData.id}`} userId={profileData.id} username={profileData.username} variant="outline" size="default" />
              <MuteUserButton key={`mute:${user?.id}:${profileData.id}`} userId={profileData.id}/>
              {user && user.id !== profileData.id && <Button variant="outline" onClick={() => navigate(`/messages/${profileData.id}`)}>Message</Button>}
              {user && user.id !== profileData?.id && (
                <Button 
                  onClick={handleFollowToggle}
                  data-page-controller="profile-follow"
                  aria-pressed={profileData.is_following}
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
            <div className="clipt-profile-stats grid grid-cols-3 gap-3 mt-4">
              <button type="button" className="min-h-11 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-300" onClick={() => setConnections('followers')}>
                <p className="text-white font-bold">{profileData?.followers_count || 0}</p>
                <p className="text-gray-400 text-sm">Followers</p>
              </button>
              <button type="button" className="min-h-11 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-300" onClick={() => setConnections('following')}>
                <p className="text-white font-bold">{profileData?.following_count || 0}</p>
                <p className="text-gray-400 text-sm">Following</p>
              </button>
              <div>
                <p className="text-white font-bold">{posts.length + clips.length}</p>
                <p className="text-gray-300 text-sm">Visible posts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="clipt-profile-tabs mb-6" aria-label="Profile content">
          <button
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium ${
              activeTab === 'posts'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('posts')}
            aria-pressed={activeTab === 'posts'}
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
            aria-pressed={activeTab === 'clips'}
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
            aria-pressed={activeTab === 'achievements'}
          >
            <Trophy className="h-4 w-4" />
            Achievements
          </button>
        </div>

        {/* Content Area */}
        {renderContent()}
      </div>
      {connections && <ProfileConnectionsDialog key={`${profileData.id}:${connections}`} profileId={profileData.id} kind={connections} onClose={() => setConnections(null)} />}
    </main>
  );
};

export default UserProfile;
