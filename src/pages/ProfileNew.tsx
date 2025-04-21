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

// Simplified animations
const pulse = keyframes`
  0% { opacity: 0.8; }
  100% { opacity: 1; }
`;

const GlobalStyle = createGlobalStyle`
  body {
    background: #121212;
    color: white;
  }
  
  @keyframes pulse {
    0% { opacity: 0.8; }
    100% { opacity: 1; }
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
              paddingTop: '60px' /* Make space for the top nav bar */
            }}
          >
            {/* Navigation Bar */}
            <div className="fixed top-0 left-0 right-0 z-50 px-2 py-1" style={{ 
              background: '#1A0F08', 
              borderBottom: '2px solid rgba(255, 85, 0, 0.3)', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)' 
            }}>
              <div className="flex justify-end items-center">
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

            {/* Profile Top Section - Simplified Header */}
            <div className="profile-header-container" style={{ background: '#1A0F08', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
              {/* User Profile Content */}
              <div className="profile-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Profile Avatar */}
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <img
                    src={profile?.avatar_url || 'https://i.imgur.com/6VBx3io.png'}
                    alt="Profile"
                    style={{ width: '120px', height: '120px', borderRadius: '60px', border: '3px solid #FF5500' }}
                  />
                  {isOwnProfile && (
                    <button 
                      style={{ 
                        position: 'absolute', 
                        bottom: '0', 
                        right: '0', 
                        backgroundColor: '#FF5500', 
                        border: 'none', 
                        borderRadius: '50%', 
                        padding: '6px', 
                        cursor: 'pointer' 
                      }} 
                      onClick={() => navigate('/profile/edit')}
                    >
                      <Camera size={16} color="white" />
                    </button>
                  )}
                </div>

                {/* Profile Info */}
                <div style={{ textAlign: 'center' }}>
                  <h1 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '4px' }}>
                    {profile?.display_name || profile?.full_name || profile?.username || 'Gaming Pro'}
                  </h1>
                  <div style={{ color: '#9e9e9e', marginBottom: '8px' }}>@{profile?.username || 'gamer'}</div>
                  <p style={{ color: '#e0e0e0', maxWidth: '400px' }}>
                    {profile?.bio || 'Professional gamer with a passion for games'}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats bar */}
            {/* Hidden stats bar */}

            {/* Trophies Header */}
            <div style={{ 
              marginBottom: '20px', 
              backgroundColor: '#0c0c0c',
              padding: '12px 16px',
              borderBottom: '1px solid #222'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>Trophies</h2>
            </div>
            
            {/* Trophies Display - Horizontal Scrollable */}
            <div style={{ 
              marginBottom: '30px', 
              overflowX: 'auto', 
              paddingBottom: '16px',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              <div style={{ 
                display: 'flex', 
                gap: '20px', 
                paddingLeft: '16px', 
                paddingRight: '16px',
                minWidth: 'min-content'
              }}>
                {/* Trophy 1 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '90px' }}>
                  <div style={{ 
                    height: '60px', 
                    width: '60px', 
                    borderRadius: '50%', 
                    backgroundColor: '#FF5500', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginBottom: '8px'
                  }}>
                    <Trophy size={30} color="white" />
                  </div>
                  <p style={{ color: 'white', fontSize: '0.75rem', textAlign: 'center', margin: '0', marginBottom: '2px' }}>First Victory</p>
                  <p style={{ color: '#FFD700', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <Trophy size={10} color="#FFD700" /> 50 pts
                  </p>
                </div>

                {/* Trophy 2 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '90px' }}>
                  <div style={{ 
                    height: '60px', 
                    width: '60px', 
                    borderRadius: '50%', 
                    backgroundColor: '#FF5500', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginBottom: '8px'
                  }}>
                    <Camera size={30} color="white" />
                  </div>
                  <p style={{ color: 'white', fontSize: '0.75rem', textAlign: 'center', margin: '0', marginBottom: '2px' }}>Content Creator</p>
                  <p style={{ color: '#FFD700', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <Trophy size={10} color="#FFD700" /> 25 pts
                  </p>
                </div>

                {/* Trophy 3 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '90px' }}>
                  <div style={{ 
                    height: '60px', 
                    width: '60px', 
                    borderRadius: '50%', 
                    backgroundColor: '#FF5500', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginBottom: '8px'
                  }}>
                    <User size={30} color="white" />
                  </div>
                  <p style={{ color: 'white', fontSize: '0.75rem', textAlign: 'center', margin: '0', marginBottom: '2px' }}>Popular Player</p>
                  <p style={{ color: '#FFD700', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <Trophy size={10} color="#FFD700" /> 100 pts
                  </p>
                </div>

                {/* Trophy 4 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '90px' }}>
                  <div style={{ 
                    height: '60px', 
                    width: '60px', 
                    borderRadius: '50%', 
                    backgroundColor: '#FF5500', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginBottom: '8px'
                  }}>
                    <Heart size={30} color="white" />
                  </div>
                  <p style={{ color: 'white', fontSize: '0.75rem', textAlign: 'center', margin: '0', marginBottom: '2px' }}>Like Machine</p>
                  <p style={{ color: '#FFD700', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <Trophy size={10} color="#FFD700" /> 75 pts
                  </p>
                </div>

                {/* Trophy 5 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '90px' }}>
                  <div style={{ 
                    height: '60px', 
                    width: '60px', 
                    borderRadius: '50%', 
                    backgroundColor: '#FF5500', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginBottom: '8px'
                  }}>
                    <Trophy size={30} color="white" />
                  </div>
                  <p style={{ color: 'white', fontSize: '0.75rem', textAlign: 'center', margin: '0', marginBottom: '2px' }}>Collector</p>
                  <p style={{ color: '#FFD700', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <Trophy size={10} color="#FFD700" /> 40 pts
                  </p>
                </div>

                {/* More trophies can be added here */}
              </div>
            </div>

            {/* Tab Navigation - Improved */}
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              borderBottom: '1px solid #333',
              marginBottom: '20px'
            }}>
              <div style={{ maxWidth: '400px', width: '100%', display: 'flex' }}>
                <button 
                  style={{ 
                    flex: 1,
                    padding: '15px 10px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'clipts' ? '3px solid #FF5500' : '3px solid transparent',
                    color: activeTab === 'clipts' ? '#FF5500' : '#9e9e9e',
                    fontWeight: activeTab === 'clipts' ? 'bold' : 'normal',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setActiveTab('clipts')}
                >
                  <Gamepad size={20} />
                  <span>Clipts</span>
                </button>
                <button 
                  style={{ 
                    flex: 1,
                    padding: '15px 10px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'saved' ? '3px solid #FF5500' : '3px solid transparent',
                    color: activeTab === 'saved' ? '#FF5500' : '#9e9e9e',
                    fontWeight: activeTab === 'saved' ? 'bold' : 'normal',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setActiveTab('saved')}
                >
                  <Heart size={20} />
                  <span>Saved</span>
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div style={{ padding: '0 10px' }}>
              {activeTab === 'clipts' && (
                <div style={{ padding: '0 16px' }}>
                  <h2 style={{ 
                    color: 'white', 
                    fontSize: '1.25rem', 
                    fontWeight: 'normal', 
                    marginBottom: '16px', 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}>
                    <Gamepad size={24} style={{ opacity: 0.8 }} />
                    <span>Clipts</span>
                  </h2>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    padding: '40px 16px',
                    backgroundColor: '#120c08',
                    borderRadius: '8px'
                  }}>
                    <div style={{ 
                      width: '50px',
                      height: '50px',
                      backgroundColor: '#1d1d1d',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px'
                    }}>
                      <Gamepad size={30} color="#555" />
                    </div>
                    <p style={{ color: '#9e9e9e', textAlign: 'center' }}>No clipts available</p>
                  </div>
                </div>
              )}
              

              
              {activeTab === 'saved' && (
                <div style={{ padding: '0 16px' }}>
                  <h2 style={{ 
                    color: 'white', 
                    fontSize: '1.25rem', 
                    fontWeight: 'normal', 
                    marginBottom: '16px', 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}>
                    <Heart size={22} style={{ opacity: 0.8 }} />
                    <span>Saved</span>
                  </h2>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    padding: '40px 16px',
                    backgroundColor: '#120c08',
                    borderRadius: '8px'
                  }}>
                    <div style={{ 
                      width: '50px',
                      height: '50px',
                      backgroundColor: '#1d1d1d',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px'
                    }}>
                      <Heart size={26} color="#555" />
                    </div>
                    <p style={{ color: '#9e9e9e', textAlign: 'center' }}>No saved clipts yet</p>
                    <button 
                      style={{ 
                        marginTop: '20px', 
                        padding: '10px 16px', 
                        backgroundColor: '#FF5500', 
                        border: 'none',
                        borderRadius: '6px', 
                        color: 'white', 
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                      onClick={() => navigate('/discovery')}
                    >
                      Discover Clipts
                    </button>
                  </div>
                </div>
              )}
              

            </div>
            
            {/* Bottom Navigation Removed */}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Profile;
