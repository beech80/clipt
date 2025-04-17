import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Profile as ProfileType } from "@/types/profile";
import { motion, AnimatePresence } from 'framer-motion';
import RetroArcadeProfile from "@/components/profile/RetroArcadeProfile";
import { getSavedClipts } from '@/lib/savedClipts';
import '../styles/profile-retro-arcade.css';
import { Gamepad, Medal, Clock, User, MessageSquare, Settings } from 'lucide-react';
import { keyframes } from "styled-components";
import { createGlobalStyle } from "styled-components";

const pulse = keyframes`
  0% { opacity: 0.6; transform: scale(1) rotate(-5deg); }
  100% { opacity: 0.8; transform: scale(1.1) rotate(-2deg); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const GlobalStyle = createGlobalStyle`
  body {
    background: #121212;
    color: white;
  }
  
  @keyframes pulse {
    0% { opacity: 0.6; transform: scale(1) rotate(-5deg); }
    100% { opacity: 0.8; transform: scale(1.1) rotate(-2deg); }
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

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
  
  // Safe profile ID handling
  const profileId = id || user?.id;
  const isOwnProfile = user?.id === profileId;
  
  // Prevent scrolling past app boundaries
  useEffect(() => {
    const handleScroll = (e: Event) => {
      if (!profileContainerRef.current) return;
      
      const container = profileContainerRef.current;
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      
      // If at the top or bottom of scroll container
      if ((scrollTop <= 0 && e.type === 'wheel') || 
          (scrollTop + clientHeight >= scrollHeight && e.type === 'wheel')) {
        e.preventDefault();
      }
    };
    
    const currentRef = profileContainerRef.current;
    if (currentRef) {
      currentRef.addEventListener('wheel', handleScroll, { passive: false });
      currentRef.addEventListener('touchmove', handleScroll, { passive: false });
    }
    
    return () => {
      if (currentRef) {
        currentRef.removeEventListener('wheel', handleScroll);
        currentRef.removeEventListener('touchmove', handleScroll);
      }
    };
  }, []);

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
      title: 'Gaming Victory',
      content: 'Just won my first tournament!',
      image_url: 'https://placehold.co/600x600/121212/A020F0?text=Gaming+Victory',
      created_at: new Date().toISOString(),
      likes_count: 24
    },
    {
      id: 'sample-2',
      title: 'New Gaming Setup',
      content: 'Check out my new gaming rig!',
      image_url: 'https://placehold.co/600x600/121212/4169E1?text=Gaming+Setup',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      likes_count: 15
    },
    {
      id: 'sample-3',
      title: 'Gameplay Video',
      content: 'Amazing comeback!',
      image_url: 'https://placehold.co/600x600/121212/32CD32?text=Gameplay',
      created_at: new Date(Date.now() - 172800000).toISOString(),
      likes_count: 42
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
      setLoading(true);
      
      // Fetch basic profile info
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();
        
      if (profileError) {
        throw profileError;
      }
      
      setProfile(data);
      
      // Fetch posts (now called clipts)
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          title,
          image_url,
          video_url,
          created_at,
          likes_count,
          views_count,
          user_id
        `)
        .eq('user_id', profileId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
        
      if (postsError) {
        console.error('Error fetching clipts:', postsError);
      }
      
      // Use actual posts or sample posts if none found
      setUserPosts(postsData?.length ? postsData : createSamplePosts());
      
      // Fetch saved clipts if viewing own profile
      if (isOwnProfile && user) {
        const savedResults = await getSavedClipts(user.id);
        if (savedResults.success) {
          setSavedCliptsData(savedResults.data);
        }
      }
      
      // Fetch followers count
      const { count: followers, error: followersError } = await supabase
        .from('followers')
        .select('follower_id', { count: 'exact' })
        .eq('following_id', profileId);
        
      if (!followersError) {
        setFollowersCount(followers || 0);
      }
      
      // Fetch following count
      const { count: following, error: followingError } = await supabase
        .from('followers')
        .select('following_id', { count: 'exact' })
        .eq('follower_id', profileId);
        
      if (!followingError) {
        setFollowingCount(following || 0);
      }
      
      // Set achievements
      setAchievements(createSampleAchievements());
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Load profile data when component mounts
  useEffect(() => {
    fetchProfileData();
  }, [profileId]);

  return (
    <>
      <GlobalStyle />
      <AnimatePresence>
        {loading ? (
          <div className="retro-loading">
            <div className="pixel-loader"></div>
            <div className="loading-text">LOADING...</div>
          </div>
        ) : error ? (
          <div className="error-message">
            <h2>Error</h2>
            <p>{error}</p>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="profile-container"
            ref={profileContainerRef}
            style={{ 
              overscrollBehavior: 'none',
              maxHeight: '100vh',
              overflow: 'auto',
              backgroundColor: '#121212',
              color: 'white'
            }}
          >
            <div style={{ padding: '0' }}>
              {/* Custom header with profile info */}
              <div className="relative overflow-hidden w-full" style={{ 
                background: '#121212',
                padding: '25px 0 20px',
                marginBottom: '20px',
                width: '100%',
                textAlign: 'center',
                position: 'relative',
                borderBottom: '1px solid rgba(255, 85, 0, 0.2)'
              }}>
                {/* Animated background */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(45deg, rgba(42, 26, 18, 0.7), rgba(18, 18, 18, 0.9))',
                  zIndex: 0,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-20%',
                    left: '-10%',
                    width: '120%',
                    height: '140%',
                    background: 'radial-gradient(circle, rgba(255, 85, 0, 0.2) 0%, rgba(255, 119, 0, 0.1) 25%, rgba(42, 26, 18, 0) 70%)',
                    transform: 'rotate(-5deg)',
                    animation: 'pulse 8s infinite alternate',
                  }} />
                </div>
                <div className="flex flex-col items-center justify-center relative z-10 gap-2">
                  <div style={{ 
                    width: '110px', 
                    height: '110px', 
                    borderRadius: '50%',
                    background: '#2A1A12',
                    border: '3px solid #FF5500',
                    boxShadow: '0 4px 16px rgba(255, 85, 0, 0.4)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    zIndex: 5
                  }}>
                    {/* Glow effect */}
                    <div style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(255, 85, 0, 0.3) 0%, rgba(42, 26, 18, 0) 70%)',
                      filter: 'blur(8px)',
                      zIndex: -1
                    }} />
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Profile" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <User size={40} color="white" />
                    )}
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(0,0,0,0.6), rgba(58, 42, 34, 0.8))',
                    backdropFilter: 'blur(5px)',
                    WebkitBackdropFilter: 'blur(5px)',
                    borderRadius: '12px',
                    }}>
                      <p style={{ 
                        fontSize: '0.9rem', 
                        lineHeight: '1.4',
                        opacity: 0.9, 
                        margin: '0 auto', 
                        color: 'rgba(255, 255, 255, 0.9)',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                      }}>
                        {profile.bio}
                      </p>
                    </div>
                  )}
                </div>
                
                {isOwnProfile && (
                  <div style={{ position: 'absolute', right: '20px', top: '20px', zIndex: 10 }}>
                    <Button 
                      size="sm"
                      variant="ghost" 
                      className="p-1 hover:bg-white/10" 
                      style={{
                        background: 'rgba(42, 26, 18, 0.7)',
                        borderRadius: '50%',
                        width: '42px',
                        height: '42px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(255, 85, 0, 0.3)',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                      }}
                      onClick={() => navigate('/settings')}
                    >
                      <Settings className="w-6 h-6" style={{
                        color: '#FF7700',
                        filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))',
                        animation: 'spin 10s linear infinite',
                      }} />
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Background decorations */}
              <div style={{ 
                position: 'absolute', 
                right: '5%', 
                top: '10%',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)',
                zIndex: 1
              }}></div>
              <div style={{ 
                position: 'absolute', 
                left: '5%', 
                bottom: '10%',
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
                zIndex: 1
              }}></div>
                savedClipts={savedCliptsData}
                achievements={achievements}
                followersCount={followersCount}
                followingCount={followingCount} 
                isOwnProfile={isOwnProfile}
                onTabChange={(tab) => setActiveTab(tab)}
                activeTab={activeTab}
              />
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="fixed bottom-0 left-0 right-0 px-2 py-1" style={{ 
            background: '#1A0F08', 
            borderTop: '2px solid rgba(255, 85, 0, 0.3)', 
            boxShadow: '0 -4px 20px rgba(0,0,0,0.4)' 
          }}>
            <div className="flex justify-around items-center">
              <Button 
                variant="ghost" 
                className="flex flex-col items-center justify-center p-2 text-xs text-gray-400 hover:text-orange-500 transition-all"
                style={{
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={() => navigate('/clipts')}
              >
                <Gamepad className="w-5 h-5 mb-1" style={{ color: '#9e9e9e' }} />
                <span>Clipts</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className="flex flex-col items-center justify-center p-2 text-xs text-gray-400 hover:text-orange-500 transition-all"
                style={{
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={() => navigate('/trophies')}
              >
                <Medal className="w-5 h-5 mb-1" style={{ color: '#9e9e9e' }} />
                <span>Trophies</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className="flex flex-col items-center justify-center p-2 text-xs text-gray-400 hover:text-orange-500 transition-all"
                style={{
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={() => navigate('/discovery')}
              >
                <Clock className="w-5 h-5 mb-1" style={{ color: '#9e9e9e' }} />
                <span>Discover</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className={`flex flex-col items-center justify-center p-2 text-xs transition-all`}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  color: isOwnProfile ? '#FF5500' : '#9e9e9e'
                }}
                onClick={() => navigate(isOwnProfile ? '/profile' : `/profile/${user?.id}`)}
              >
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '60%',
                  height: '2px',
                  background: isOwnProfile ? '#FF5500' : 'transparent',
                  borderRadius: '2px',
                  transition: 'all 0.3s ease'
                }} />
                <User className="w-5 h-5 mb-1" style={{ color: isOwnProfile ? '#FF5500' : '#9e9e9e' }} />
                <span>Profile</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className="flex flex-col items-center justify-center p-2 text-xs text-gray-400 hover:text-orange-500 transition-all"
                style={{
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={() => navigate('/messages')}
              >
                <MessageSquare className="w-5 h-5 mb-1" style={{ color: '#9e9e9e' }} />
                <span>Chat</span>
              </Button>
            </div>
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Profile;
