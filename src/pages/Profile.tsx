import ProfileWebsite from '@/components/profile/ProfileWebsite';
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Gamepad2, Trophy, MessageSquare, Settings, UserX, Pencil, Grid, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useParams, useNavigate } from "react-router-dom";
import AchievementList from "@/components/achievements/AchievementList";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Profile as ProfileType } from "@/types/profile";
import styled from "styled-components";
import { UserLink } from '@/components/user/UserLink';
import ProfilePostTile from '@/components/profile/ProfilePostTile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ProfileConnectionsDialog from '@/components/profile/ProfileConnectionsDialog';
import type { ConnectionKind } from '@/lib/profile-connections';

/**
 * Profile page component - displays user profile details
 */
const ProfileContent = styled.div`
  max-height: none; /* Remove any height restrictions */
  overflow-y: visible; /* Allow content to be visible */
  padding-bottom: 24px; /* The app shell reserves controller clearance. */
  
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
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const requestRevision = useRef(0);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'posts' | 'clips' | 'achievements'>('posts');
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPosts, setUserPosts] = useState<(import('@/types/post').Post & { post_type: string | null })[]>([]);
  
  // Stats for displaying counts
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    achievements: 0
  });
  const [connections, setConnections] = useState<ConnectionKind | null>(null);

  // Safe profile ID handling
  const profileId = id || user?.id;
  const isOwnProfile = user?.id === profileId;

  /**
   * Fetch the user's profile data
   */
  const fetchProfileData = useCallback(async (targetId: string) => {
    try {
      if (targetId === userId) {
        const { data, error } = await supabase.rpc('get_own_profile').retry(false);
        if (error) throw error;
        return data?.[0] ?? null;
      }
      // Try to get the profile by ID
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id,username,avatar_url,created_at,bio,website,display_name,is_moderator,bio_description,location,custom_theme,social_links,is_verified')
        .eq('id', targetId)
        .maybeSingle();
      
      if (error) throw error;
      
      return profile;
    } catch (error) {
      console.error("Error fetching profile:", error);
      
      // Do not turn an authorization/network failure into fabricated profile data.
      throw error;
    }
  }, [userId]);

  const loadProfileData = useCallback(async () => {
    if (!profileId) return;
    const revision = ++requestRevision.current;
    setLoading(true);
    setError(null);
    setProfile(null);
    setUserPosts([]);
    try {
      // Fetch profile data
      const profileData = await fetchProfileData(profileId);
      if (revision !== requestRevision.current) return;
      
      if (!profileData) {
        setError("Profile not found");
        setLoading(false);
        return;
      }
      
      setProfile(profileData);
      
      const [followers, following, achievements] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profileId),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profileId),
        supabase.from('user_achievements').select('*', { count: 'exact', head: true }).eq('user_id', profileId),
      ]);
      if (revision !== requestRevision.current) return;
      for (const result of [followers, following, achievements]) {
        if (result.error) throw result.error;
      }
      setStats({
        followers: followers.count ?? 0,
        following: following.count ?? 0,
        achievements: achievements.count ?? 0
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
          .eq('is_published', true)
          .order('created_at', { ascending: false });
        if (revision !== requestRevision.current) return;
        
        if (postsError) {
          console.error("Error fetching posts:", postsError);
          throw postsError;
        } else {
          setUserPosts((postsData || []).map(post => ({ ...post,
            likes_count: post.likes_count[0]?.count ?? 0,
            comments_count: post.comments_count[0]?.count ?? 0,
          })));
        }
      } catch (postError) {
        console.error("Error fetching user posts:", postError);
        throw postError;
      }
      
      // Success - clear any errors
      setError(null);
    } catch (error) {
      console.error("Error in profile data loading:", error);
      
      if (revision === requestRevision.current) setError("Failed to load profile data");
    } finally {
      if (revision === requestRevision.current) setLoading(false);
    }
  }, [profileId, fetchProfileData]);

  // Load only after Auth is ready; invalidate responses from prior routes/users.
  useEffect(() => {
    if (authLoading) { setLoading(true); return; }
    if (!profileId) { setLoading(false); setProfile(null); setUserPosts([]); return; }
    void loadProfileData();
    return () => { requestRevision.current += 1; };
  }, [authLoading, profileId, loadProfileData]);

  // Render loading state
  if (loading) {
    return (
      <div role="status" aria-label="Loading profile" className="flex flex-col items-center justify-center min-h-screen p-4">
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
          <Button onClick={() => { setLoading(true); void loadProfileData(); }}>Retry profile</Button>
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
    <ProfileContent className="clipt-profile mx-auto max-w-6xl px-4 py-6">
      {/* Profile Header */}
      <div className="clipt-profile-header gaming-card p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gaming-800 overflow-hidden border-4 border-gaming-500">
              <Avatar className="w-full h-full">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.username || 'User'} className="object-cover" />
                <AvatarFallback className="bg-gaming-700 text-4xl font-bold text-gaming-300">
                  {(profile.username?.[0] || profile.display_name?.[0] || 'U').toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          
          {/* Profile Info */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-col md:flex-row gap-4 items-center md:items-start justify-between">
              <div className="text-center md:text-left">
                <h1 className="text-2xl font-bold text-gaming-200 mb-1 break-words [overflow-wrap:anywhere]">
                  {profile.display_name || profile.username || 'User'}
                </h1>
                <UserLink username={profile.username} />
                {profile.location && <p className="flex items-center gap-1 text-sm text-purple-200"><MapPin size={14} aria-hidden="true" />{profile.location}</p>}
                <p className="text-gaming-300 max-w-md mb-4 break-words [overflow-wrap:anywhere]">{profile.bio || 'No bio provided'}</p>
                <ProfileWebsite value={profile.website} />
              </div>
              
              <div className="flex justify-end gap-2">
                {isOwnProfile && (
                  <Button 
                    onClick={() => navigate('/profile/edit')} 
                    variant="outline" 
                    className="flex items-center gap-2 bg-[#1a1b4b] border border-white/10 text-white hover:bg-[#272a5b] px-4 py-1 rounded-sm"
                  >
                    <Pencil className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </Button>
                )}
                {isOwnProfile && <Button variant="outline" aria-label="Account settings" onClick={() => navigate('/settings')}><Settings className="w-4 h-4" /></Button>}
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
            <div className="clipt-profile-stats grid grid-cols-3 gap-3 mt-4">
              <button type="button" className="text-center min-h-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-300" onClick={() => setConnections('followers')}>
                <p className="text-gaming-200 font-bold">{stats.followers}</p>
                <p className="text-gaming-400 text-sm">Followers</p>
              </button>
              <button type="button" className="text-center min-h-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-300" onClick={() => setConnections('following')}>
                <p className="text-gaming-200 font-bold">{stats.following}</p>
                <p className="text-gaming-400 text-sm">Following</p>
              </button>
              <button type="button" className="text-center min-h-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-300" onClick={() => setActiveTab('achievements')}>
                <p className="text-gaming-200 font-bold">{isOwnProfile ? stats.achievements : 'Private'}</p>
                <p className="text-gaming-400 text-sm">Achievements</p>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      {isOwnProfile && <Button variant="outline" className="mb-4" onClick={() => navigate('/drafts')}>Your private drafts</Button>}
      <div className="flex mb-6">
        <div className="gaming-card p-2">
          <div className="clipt-profile-tabs" aria-label="Profile content">
            <Toggle pressed={activeTab === 'posts'} onPressedChange={() => setActiveTab('posts')} variant="outline"><Grid className="w-4 h-4 mr-2" aria-hidden="true" />Posts</Toggle>
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
      {activeTab !== 'achievements' ? (
        <div className="clipt-profile-grid">
          {userPosts.filter(post => activeTab === 'posts' || post.post_type === 'clipt').length > 0 ? (
            userPosts.filter(post => activeTab === 'posts' || post.post_type === 'clipt').map(post => (
              <ProfilePostTile key={post.id} post={post} likes={post.likes_count ?? 0} comments={post.comments_count ?? 0} />
            ))
          ) : (
            <Card className="gaming-card p-8 flex flex-col items-center justify-center text-center h-60">
              <Gamepad2 className="w-12 h-12 text-gaming-400 mb-4" />
              <h3 className="text-xl font-semibold text-gaming-200 mb-2">No {activeTab === 'clips' ? 'Clipts' : 'Posts'} Yet</h3>
              <p className="text-gaming-400">No visible content in this category.</p>
            </Card>
          )}
        </div>
      ) : (
        <div className="gaming-card p-6">
          <AchievementList userId={profileId} />
        </div>
      )}
      {connections && profileId && <ProfileConnectionsDialog key={`${profileId}:${connections}`} profileId={profileId} kind={connections} onClose={() => setConnections(null)} />}
    </ProfileContent>
  );
};

export default Profile;
