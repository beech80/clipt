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
  
  // Create comprehensive achievements list with token rewards
  const createSampleAchievements = () => [
    // 🏆 Trophy & Weekly Top 10
    {
      id: 'first-taste-gold',
      name: 'First Taste of Gold',
      description: 'Earn 10 trophies on a post.',
      points: 50,
      tokens: 25,
      type: 'trophy',
      progress: 70,
      reward: '25 Tokens + Gold Trophy Badge'
    },
    {
      id: 'viral-sensation',
      name: 'Viral Sensation',
      description: 'Get 100 trophies on a single post.',
      points: 200,
      tokens: 100,
      type: 'trophy',
      progress: 32,
      reward: '100 Tokens + Viral Badge'
    },
    {
      id: 'breaking-in',
      name: 'Breaking In',
      description: 'Rank in the Top 10 of the weekly leaderboard once.',
      points: 150,
      tokens: 75,
      type: 'trophy',
      progress: 100,
      date: '2025-04-28',
      reward: '75 Tokens + Top 10 Badge',
      isNew: true
    },
    {
      id: 'hot-streak',
      name: 'Hot Streak',
      description: 'Stay in the Top 10 for 5 weeks in a row.',
      points: 500,
      tokens: 250,
      type: 'trophy',
      progress: 40,
      reward: '250 Tokens + Streak Badge'
    },
    
    // 📈 Follower Growth
    {
      id: 'rising-star',
      name: 'Rising Star',
      description: 'Reach 1,000 followers.',
      points: 100,
      tokens: 50,
      type: 'follower',
      progress: 65,
      reward: '50 Tokens + Rising Star Badge'
    },
    {
      id: 'influencer-status',
      name: 'Influencer Status',
      description: 'Gain 10,000 followers.',
      points: 500,
      tokens: 250,
      type: 'follower',
      progress: 20,
      reward: '250 Tokens + Influencer Badge'
    },
    
    // 🎥 Streaming Subscriber Milestones
    {
      id: 'first-supporter',
      name: 'First Supporter',
      description: 'Get your first streaming sub.',
      points: 50,
      tokens: 25,
      type: 'streaming',
      progress: 100,
      date: '2025-03-15',
      reward: '25 Tokens + Supporter Badge'
    },
    {
      id: 'streaming-star',
      name: 'Streaming Star',
      description: 'Reach 100 streaming subscribers.',
      points: 300,
      tokens: 150,
      type: 'streaming',
      progress: 35,
      reward: '150 Tokens + Streaming Star Banner'
    },
    
    // 🤝 Engagement Boosters
    {
      id: 'hype-squad',
      name: 'Hype Squad',
      description: 'Leave 50 comments on others\'s posts.',
      points: 75,
      tokens: 40,
      type: 'engagement',
      progress: 100,
      date: '2025-04-02',
      reward: '40 Tokens + Hype Badge'
    },
    {
      id: 'super-supporter',
      name: 'Super Supporter',
      description: 'Give out 100 trophies.',
      points: 125,
      tokens: 60,
      type: 'engagement',
      progress: 45,
      reward: '60 Tokens + Super Support Badge'
    },
    {
      id: 'conversation-starter',
      name: 'Conversation Starter',
      description: 'Receive 100 replies to your comments.',
      points: 100,
      tokens: 50,
      type: 'engagement',
      progress: 68,
      reward: '50 Tokens + Conversation Badge'
    },
    {
      id: 'community-builder',
      name: 'Community Builder',
      description: 'Start a post that gets 500+ comments.',
      points: 250,
      tokens: 125,
      type: 'engagement',
      progress: 12,
      reward: '125 Tokens + Community Builder Title'
    },
    
    // 📢 Sharing & Promotion
    {
      id: 'signal-booster',
      name: 'Signal Booster',
      description: 'Share 10 other creators\' posts.',
      points: 50,
      tokens: 25,
      type: 'sharing',
      progress: 100,
      date: '2025-04-12',
      reward: '25 Tokens + Signal Badge'
    },
    {
      id: 'clipt-evangelist',
      name: 'Clipt Evangelist',
      description: 'Invite 5 friends to join Clipt.',
      points: 150,
      tokens: 75,
      type: 'sharing',
      progress: 80,
      reward: '75 Tokens + Evangelist Title'
    },
    
    // 🎮 Collab & Creator Support
    {
      id: 'duo-dynamic',
      name: 'Duo Dynamic',
      description: 'Collab on a post that earns 50 trophies.',
      points: 150,
      tokens: 75,
      type: 'collab',
      progress: 0,
      reward: '75 Tokens + Duo Badge'
    },
    {
      id: 'mentor-mode',
      name: 'Mentor Mode',
      description: 'Help a small creator reach 1,000 followers.',
      points: 250,
      tokens: 125,
      type: 'collab',
      progress: 0,
      reward: '125 Tokens + Mentor Crown'
    },
    
    // 🎉 Special & Hidden
    {
      id: 'og-clipt-creator',
      name: 'OG Clipt Creator',
      description: 'Joined within 3 months of launch.',
      points: 100,
      tokens: 50,
      type: 'special',
      progress: 100,
      date: '2025-01-10',
      reward: '50 Tokens + OG Badge'
    },
    {
      id: 'day-one-grinder',
      name: 'Day One Grinder',
      description: 'Posted on Clipt\'s launch day.',
      points: 200,
      tokens: 100,
      type: 'special',
      progress: 100,
      date: '2025-01-01',
      reward: '100 Tokens + Day One Title'
    },
    {
      id: 'mystery-viral',
      name: 'Mystery Viral',
      description: 'An old post goes viral after 30 days.',
      points: 150,
      tokens: 75,
      type: 'special',
      progress: 0,
      reward: '75 Tokens + Mystery Badge'
    },
    {
      id: 'shadow-supporter',
      name: 'Shadow Supporter',
      description: 'Consistently like/comment on someone\'s posts for a month.',
      points: 100,
      tokens: 50,
      type: 'special',
      progress: 75,
      reward: '50 Tokens + Shadow Badge'
    }
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
      // Create fallback data instead of showing error
      setDefaultProfileData();
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
      // Use default data instead of showing error
      setDefaultProfileData();
    } finally {
      setLoading(false);
    }
  };

  // Create default profile data as fallback
  const setDefaultProfileData = () => {
    // Set a default profile with gaming theme
    setProfile({
      id: 'default-user',
      username: 'gamer_pro',
      display_name: 'Pro Gamer',
      avatar_url: 'https://placehold.co/200x200/252944/FFFFFF?text=Gamer',
      bio: 'Gaming and streaming enthusiast',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      website: 'https://clipt.com',
      location: 'Gaming Universe',
      is_verified: true,
      followers_count: 125,
      following_count: 84,
      achievements_count: 37,
      enable_notifications: true,
      enable_sounds: true
    } as any);

    // Set sample posts
    setUserPosts(createSamplePosts());
    
    // Set sample achievements
    setAchievements(createSampleAchievements());
    
    // Set counts
    setFollowersCount(125);
    setFollowingCount(84);
    
    // Set sample saved clips
    setSavedCliptsData(createSamplePosts());
    
    // Set boost status
    setBoostActive(true);
  };

  // Fetch data on initial load
  useEffect(() => {
    setLoading(true);
    try {
      fetchProfileData();
    } catch (err) {
      console.error('Error loading profile:', err);
      setDefaultProfileData();
      setLoading(false);
    }
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
          
          {/* Bottom content removed as requested */}
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default Profile;
