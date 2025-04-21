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
import '../styles/profile-top-section.css';
import { 
  Gamepad, 
  Medal, 
  Clock, 
  User, 
  MessageSquare, 
  Settings, 
  Users, 
  Heart, 
  Camera, 
  Trophy, 
  Edit, 
  Link, 
  ExternalLink, 
  MapPin, 
  Calendar 
} from 'lucide-react';
import { createGlobalStyle, keyframes } from "styled-components";

// Animations
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
    { id: 5, name: 'Collector', description: 'Save 20 clips from others', icon: 'Bookmark', points: 40 },
    { id: 6, name: 'Stream Star', description: 'Complete your first livestream', icon: 'Video', points: 80 },
    { id: 7, name: 'Community Leader', description: 'Create a gaming community', icon: 'Users', points: 120 },
    { id: 8, name: 'Clip Master', description: 'Create 50+ clips', icon: 'Scissors', points: 150 }
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
      image_url: 'https://placehold.co/600x600/121212/FF5500?text=Gameplay',
      created_at: new Date(Date.now() - 172800000).toISOString(),
      likes_count: 32
    }
  ];

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!profileId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single();
        
        if (profileError) {
          throw new Error(profileError.message);
        }
        
        if (profileData) {
          setProfile(profileData);
          
          // For demo purposes, generate sample content if no real data
          const samplePosts = createSamplePosts();
          setUserPosts(samplePosts);
          
          // Fetch saved clipts if this is the current user's profile
          if (isOwnProfile) {
            try {
              const savedCliptsResult = await getSavedClipts(profileId);
              setSavedCliptsData(savedCliptsResult || []);
            } catch (error) {
              console.error("Failed to fetch saved clipts:", error);
              setSavedCliptsData([]);
            }
          }
          
          // Get followers count
          try {
            const { count: followers } = await supabase
              .from('followers')
              .select('*', { count: 'exact', head: true })
              .eq('followed_id', profileId);
            
            setFollowersCount(followers || 0);
          } catch (error) {
            console.error("Error fetching followers:", error);
          }
          
          // Get following count
          try {
            const { count: following } = await supabase
              .from('followers')
              .select('*', { count: 'exact', head: true })
              .eq('follower_id', profileId);
            
            setFollowingCount(following || 0);
          } catch (error) {
            console.error("Error fetching following:", error);
          }
          
          // For demo purposes, generate sample achievements
          setAchievements(createSampleAchievements());
        }
      } catch (error) {
        console.error("Error in fetchProfileData:", error);
        setError(error instanceof Error ? error.message : "An unknown error occurred");
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [profileId, isOwnProfile]);

  return (
    <>
      <GlobalStyle />
      <AnimatePresence mode="wait">
        {loading ? (
          <div className="flex justify-center items-center h-screen">
            <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="flex flex-col justify-center items-center h-screen p-4">
            <div className="text-red-500 text-lg mb-4">Error: {error}</div>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
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
              color: 'white',
              paddingTop: '60px', /* Make space for the top nav bar */
              paddingBottom: '70px' /* Make space for the bottom nav bar */
            }}
          >
            {/* Navigation Bar */}
            <div className="fixed top-0 left-0 right-0 z-50 px-2 py-1" style={{ 
              background: '#1A0F08', 
              borderBottom: '2px solid rgba(255, 85, 0, 0.3)', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)' 
            }}>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Button 
                    variant="ghost" 
                    className="p-2"
                    onClick={() => navigate(-1)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </Button>
                  <h1 className="text-xl font-bold">{profile?.username || 'Profile'}</h1>
                </div>
                {isOwnProfile && (
                  <Button 
                    variant="ghost" 
                    className="p-2"
                    onClick={() => navigate('/profile/edit')}
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Profile Top Section - Arcade/Neon Header */}
            <div className="profile-header-container arcade-bg-animated">
              {/* Animated Arcade/Retro Neon Background */}
              <div className="profile-cover-image">
                <div className="profile-cover-pattern arcade-pixel-pattern"></div>
                <div className="arcade-neon-glow"></div>
              </div>

              {/* User Profile Content */}
              <div className="profile-float-card glassmorphic-card">
                {/* Profile Avatar with Level Ring and Animation */}
                <div className="profile-avatar-container">
                  <div className="profile-avatar-glow animated-glow"></div>
                  <div className="profile-avatar-level-ring">
                    <svg width="150" height="150">
                      <circle cx="75" cy="75" r="65" stroke="#FF7700" strokeWidth="7" fill="none" style={{ filter: 'drop-shadow(0 0 14px #FF5500)' }} />
                    </svg>
                    <img
                      src={profile?.avatar_url || 'https://i.imgur.com/6VBx3io.png'}
                      alt="Profile"
                      className="profile-avatar arcade-avatar-bounce"
                    />
                    {isOwnProfile && (
                      <button className="edit-avatar-button" onClick={() => navigate('/profile/edit')}>
                        <Camera size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Profile Info */}
                <div className="profile-info">
                  <h1 className="profile-name arcade-neon-text">
                    {profile?.display_name || profile?.full_name || profile?.username || 'Gaming Pro'}
                  </h1>
                  <div className="profile-username">@{profile?.username || 'gamer'}</div>
                  <p className="profile-bio">
                    {profile?.bio || 'Professional gamer with a passion for games'}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats bar */}
            <div className="profile-stats-bar">
              <div className="stat-item animated-stat">
                <div className="stat-value">{userPosts.length}</div>
                <div className="stat-label">Posts</div>
              </div>
              <div className="stat-item animated-stat">
                <div className="stat-value">{followersCount}</div>
                <div className="stat-label">Followers</div>
              </div>
              <div className="stat-item animated-stat">
                <div className="stat-value">{followingCount}</div>
                <div className="stat-label">Following</div>
              </div>
              <div className="stat-item animated-stat">
                <div className="stat-value">{achievements.length}</div>
                <div className="stat-label">Trophies</div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="profile-tabs-container">
              <button 
                className={`profile-tab ${activeTab === 'clipts' ? 'active' : ''}`} 
                onClick={() => setActiveTab('clipts')}
              >
                <Gamepad size={20} />
                <span>Clipts</span>
              </button>
              <button 
                className={`profile-tab ${activeTab === 'achievements' ? 'active' : ''}`} 
                onClick={() => setActiveTab('achievements')}
              >
                <Trophy size={20} />
                <span>Trophies</span>
              </button>
              <button 
                className={`profile-tab ${activeTab === 'saved' ? 'active' : ''}`} 
                onClick={() => setActiveTab('saved')}
              >
                <Heart size={20} />
                <span>Saved</span>
              </button>
              <button 
                className={`profile-tab ${activeTab === 'about' ? 'active' : ''}`} 
                onClick={() => setActiveTab('about')}
              >
                <User size={20} />
                <span>About</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="profile-content-area">
              {activeTab === 'clipts' && (
                <div className="tab-content">
                  <h2 className="text-xl font-bold mb-4 text-white">Clipts</h2>
                  <div className="content-grid">
                    {userPosts.map((post) => (
                      <div key={post.id} className="content-card">
                        <div className="relative pb-[100%] overflow-hidden">
                          <img 
                            src={post.image_url} 
                            alt={post.title} 
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-3">
                          <h3 className="text-white font-semibold mb-1">{post.title}</h3>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">{new Date(post.created_at).toLocaleDateString()}</span>
                            <div className="flex items-center gap-1">
                              <Heart size={14} className="text-orange-500" />
                              <span className="text-sm text-gray-300">{post.likes_count}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {activeTab === 'achievements' && (
                <div className="tab-content">
                  <h2 className="text-xl font-bold mb-4 text-white">Trophies</h2>
                  <div className="content-grid">
                    {achievements.map((achievement) => (
                      <div key={achievement.id} className="content-card">
                        <div className="p-4 flex flex-col items-center gap-3">
                          <div className="h-16 w-16 flex items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-yellow-500">
                            {achievement.icon === 'Trophy' && <Trophy size={32} className="text-white" />}
                            {achievement.icon === 'VideoIcon' && <Camera size={32} className="text-white" />}
                            {achievement.icon === 'UserPlus' && <User size={32} className="text-white" />}
                            {achievement.icon === 'Heart' && <Heart size={32} className="text-white" />}
                            {achievement.icon === 'Bookmark' && <Trophy size={32} className="text-white" />}
                          </div>
                          <h3 className="text-white font-semibold text-center">{achievement.name}</h3>
                          <p className="text-gray-400 text-sm text-center">{achievement.description}</p>
                          <div className="flex items-center gap-1 mt-2">
                            <Trophy size={14} className="text-yellow-500" />
                            <span className="text-yellow-500">{achievement.points} pts</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {activeTab === 'saved' && (
                <div className="tab-content">
                  <h2 className="text-xl font-bold mb-4 text-white">Saved Clipts</h2>
                  {savedCliptsData.length > 0 ? (
                    <div className="content-grid">
                      {savedCliptsData.map((clipt) => (
                        <div key={clipt.id} className="content-card">
                          <div className="relative pb-[100%] overflow-hidden">
                            <img 
                              src={clipt.image_url || "https://placehold.co/600x600/121212/FF5500?text=Saved+Clipt"} 
                              alt={clipt.title || "Saved Clipt"} 
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-3">
                            <h3 className="text-white font-semibold mb-1">{clipt.title || "Awesome Clipt"}</h3>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400 text-sm">Saved</span>
                              <Heart size={16} className="text-red-500" fill="#ef4444" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10">
                      <Heart size={48} className="text-gray-500 mb-4" />
                      <p className="text-gray-400">No saved clipts yet</p>
                      <button 
                        className="mt-4 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg text-white font-semibold"
                        onClick={() => navigate('/discovery')}
                      >
                        Discover Clipts
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'about' && (
                <div className="tab-content">
                  <h2 className="text-xl font-bold mb-4 text-white">About</h2>
                  <div className="bg-[#2A1A12] p-4 rounded-lg border border-orange-500/30">
                    <p className="text-white mb-4">{profile?.bio || "No bio available yet."}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div className="flex flex-col gap-3">
                        <h3 className="text-orange-500 font-semibold">Info</h3>
                        <div className="flex items-center gap-2">
                          <User className="text-orange-500" size={16} />
                          <span className="text-gray-300">Username: @{profile?.username}</span>
                        </div>
                        {profile?.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="text-orange-500" size={16} />
                            <span className="text-gray-300">{profile.location}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        <h3 className="text-orange-500 font-semibold">Stats</h3>
                        <div className="flex items-center gap-2">
                          <Trophy className="text-orange-500" size={16} />
                          <span className="text-gray-300">{achievements.length} Achievements</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="text-orange-500" size={16} />
                          <span className="text-gray-300">{followersCount} Followers</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Bottom Navigation */}
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
