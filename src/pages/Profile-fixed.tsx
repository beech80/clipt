import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Profile as ProfileType } from "@/types/profile";
import { motion, AnimatePresence } from 'framer-motion';
import GamingProfile from "@/components/profile/GamingProfile";
import { getSavedClipts } from '@/lib/savedClipts';
import '../styles/gaming/profile-gaming.css';
import { Gamepad, Medal, Clock, User, MessageSquare, Settings, Rocket, Zap, Star } from 'lucide-react';

const Profile = () => {
  // Component state
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const profileContainerRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [savedCliptsData, setSavedCliptsData] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('clipts');
  const [tokenBalance, setTokenBalance] = useState(2500);
  const [boostActive, setBoostActive] = useState(false);
  
  // Safe profile ID handling
  const profileId = id || user?.id;
  const isOwnProfile = user?.id === profileId;
  
  // Create sample achievements for testing
  const createSampleAchievements = () => [
    { id: 1, name: 'First Victory', description: 'Win your first game', icon: 'Trophy', points: 50 },
    { id: 2, name: 'Content Creator', description: 'Post your first clip', icon: 'VideoIcon', points: 25 },
    { id: 3, name: 'Popular Player', description: 'Reach 10 followers', icon: 'UserPlus', points: 100 },
    { id: 4, name: 'Like Machine', description: 'Get 50 likes on your content', icon: 'Heart', points: 75 },
    { id: 5, name: 'Collector', description: 'Save 20 clips from others', icon: 'Bookmark', points: 40 }
  ];

  // Create sample posts for testing
  const createSamplePosts = () => [
    {
      id: 'sample-1',
      title: 'Epic Sniper Shot',
      content: 'Just landed this impossible shot!',
      image_url: 'https://placehold.co/600x400/232842/FFFFFF?text=Gaming+Highlight',
      video_url: null,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      likes_count: 85,
      views_count: 437,
      user_id: {
        id: profileId,
        username: 'gameplay_master',
        avatar_url: null
      }
    },
    {
      id: 'sample-2',
      title: 'Tournament Victory',
      content: 'Won the championship!',
      image_url: 'https://placehold.co/600x400/412864/FFFFFF?text=Tournament+Win',
      video_url: 'https://www.example.com/fake-video.mp4',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      likes_count: 201,
      views_count: 1429,
      user_id: {
        id: profileId,
        username: 'gameplay_master',
        avatar_url: null
      }
    },
    {
      id: 'sample-3',
      title: 'Perfect Combo Streak',
      content: 'Check out this combo!',
      image_url: 'https://placehold.co/600x400/1e2a4d/FFFFFF?text=Pro+Combo',
      video_url: null,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      likes_count: 124,
      views_count: 832,
      user_id: {
        id: profileId,
        username: 'gameplay_master',
        avatar_url: null
      }
    }
  ];

  // Fetch profile data
  const fetchProfileData = async () => {
    if (!profileId) {
      setError('No profile ID available');
      setLoading(false);
      return;
    }

    try {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (profileError) throw profileError;

      if (profileData) {
        setProfile(profileData);
      } else {
        // If profile doesn't exist but we have user data, create a placeholder
        if (user && user.id === profileId) {
          const placeholderProfile = {
            id: user.id,
            username: user.user_metadata?.username || 'user',
            avatar_url: user.user_metadata?.avatar_url,
            bio: 'Gaming enthusiast',
            display_name: user.user_metadata?.full_name || 'New Gamer',
            created_at: new Date().toISOString()
          };
          setProfile(placeholderProfile as any);
        } else {
          setError('Profile not found');
        }
      }

      // Fetch user posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*, user_id(*)')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        // Use sample data if fetching fails
        setUserPosts(createSamplePosts());
      } else {
        setUserPosts(postsData.length > 0 ? postsData : createSamplePosts());
      }

      // Fetch saved clips for the user
      if (user && user.id) {
        const savedClipts = await getSavedClipts(user.id);
        setSavedCliptsData(savedClipts || []);
      }

      // Fetch achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', profileId);

      if (achievementsError) {
        console.error('Error fetching achievements:', achievementsError);
        // Use sample achievements if fetching fails
        setAchievements(createSampleAchievements());
      } else {
        setAchievements(achievementsData.length > 0 ? achievementsData : createSampleAchievements());
      }

      // Fetch followers count
      try {
        const { count: followers } = await supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', profileId);
        
        setFollowersCount(followers || 0);
      } catch (err) {
        console.error('Error fetching followers count:', err);
        setFollowersCount(Math.floor(Math.random() * 100) + 10); // Sample count
      }

      // Fetch following count
      try {
        const { count: following } = await supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', profileId);
        
        setFollowingCount(following || 0);
      } catch (err) {
        console.error('Error fetching following count:', err);
        setFollowingCount(Math.floor(Math.random() * 50) + 5); // Sample count
      }

      // Fetch token balance if applicable
      try {
        const { data: tokenData } = await supabase
          .from('user_tokens')
          .select('balance')
          .eq('user_id', profileId)
          .single();
        
        if (tokenData) {
          setTokenBalance(tokenData.balance);
        }
      } catch (err) {
        console.error('Error fetching token balance:', err);
        // Keep default token balance
      }

      // Check if user has active boost
      try {
        const { data: boostData } = await supabase
          .from('user_boosts')
          .select('*')
          .eq('user_id', profileId)
          .eq('is_active', true)
          .single();
        
        setBoostActive(!!boostData);
      } catch (err) {
        console.error('Error fetching boost status:', err);
        // Keep default boost status
      }

    } catch (error: any) {
      console.error('Error fetching profile data:', error.message);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on initial load
  useEffect(() => {
    setLoading(true);
    fetchProfileData();
  }, [profileId]);

  // Handle tab switching
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="gaming-loading-screen">
        <div className="gaming-loading-text">LOADING PROFILE...</div>
        <div className="loading-bar-container">
          <div className="loading-bar"></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
        <div className="text-2xl font-bold text-red-500 mb-2">Error</div>
        <p className="text-center mb-4">{error}</p>
        <Button 
          onClick={() => navigate('/')}
          className="gaming-button glow-effect"
        >
          Return to Home
        </Button>
      </div>
    );
  }

  // Render profile
  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen"
          ref={profileContainerRef}
        >
          {/* Main Profile Content */}
          <GamingProfile
            profile={profile}
            tokenBalance={tokenBalance}
            achievements={achievements}
            userPosts={userPosts}
            savedItems={savedCliptsData}
            followersCount={followersCount}
            followingCount={followingCount}
            isOwnProfile={isOwnProfile}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            boostActive={boostActive}
          />
          
          {/* Navigation Bar */}
          <div className="gaming-nav-bar flex justify-around items-center">
            <button 
              className={`nav-button ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => navigate('/')}
            >
              <Gamepad className="nav-icon" />
              <span className="nav-label">Home</span>
            </button>
            
            <button 
              className={`nav-button ${activeTab === 'discover' ? 'active' : ''}`}
              onClick={() => navigate('/discovery')}
            >
              <Medal className="nav-icon" />
              <span className="nav-label">Discover</span>
            </button>
            
            <button 
              className={`nav-button ${isOwnProfile ? 'active' : ''}`}
              onClick={() => navigate(isOwnProfile ? '/profile' : `/profile/${user?.id}`)}
            >
              <User className="nav-icon" />
              <span className="nav-label">Profile</span>
            </button>
            
            <button 
              className="nav-button"
              onClick={() => navigate('/boost')}
            >
              <Rocket className="nav-icon" />
              <span className="nav-label">Boost</span>
            </button>
            
            <button 
              className="nav-button"
              onClick={() => navigate('/messages')}
            >
              <MessageSquare className="nav-icon" />
              <span className="nav-label">Chat</span>
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default Profile;
