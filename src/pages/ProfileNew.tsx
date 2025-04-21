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
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-around', 
              padding: '16px', 
              backgroundColor: '#1A0F08', 
              borderRadius: '8px', 
              marginBottom: '20px' 
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'white', fontWeight: 'bold' }}>{userPosts.length}</div>
                <div style={{ color: '#FF5500', fontSize: '0.8rem' }}>Posts</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'white', fontWeight: 'bold' }}>{followersCount}</div>
                <div style={{ color: '#FF5500', fontSize: '0.8rem' }}>Followers</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'white', fontWeight: 'bold' }}>{followingCount}</div>
                <div style={{ color: '#FF5500', fontSize: '0.8rem' }}>Following</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'white', fontWeight: 'bold' }}>{achievements.length}</div>
                <div style={{ color: '#FF5500', fontSize: '0.8rem' }}>Trophies</div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div style={{ 
              display: 'flex', 
              borderBottom: '1px solid #333',
              marginBottom: '20px'
            }}>
              <button 
                style={{ 
                  flex: 1,
                  padding: '10px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'clipts' ? '2px solid #FF5500' : '2px solid transparent',
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
                <Gamepad size={18} />
                <span>Clipts</span>
              </button>
              <button 
                style={{ 
                  flex: 1,
                  padding: '10px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'achievements' ? '2px solid #FF5500' : '2px solid transparent',
                  color: activeTab === 'achievements' ? '#FF5500' : '#9e9e9e',
                  fontWeight: activeTab === 'achievements' ? 'bold' : 'normal',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => setActiveTab('achievements')}
              >
                <Trophy size={18} />
                <span>Trophies</span>
              </button>
              <button 
                style={{ 
                  flex: 1,
                  padding: '10px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'saved' ? '2px solid #FF5500' : '2px solid transparent',
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
                <Heart size={18} />
                <span>Saved</span>
              </button>
              <button 
                style={{ 
                  flex: 1,
                  padding: '10px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'about' ? '2px solid #FF5500' : '2px solid transparent',
                  color: activeTab === 'about' ? '#FF5500' : '#9e9e9e',
                  fontWeight: activeTab === 'about' ? 'bold' : 'normal',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => setActiveTab('about')}
              >
                <User size={18} />
                <span>About</span>
              </button>
            </div>

            {/* Content Area */}
            <div style={{ padding: '0 10px' }}>
              {activeTab === 'clipts' && (
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '16px', color: 'white' }}>Clipts</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
                    {userPosts.map((post) => (
                      <div key={post.id} style={{ backgroundColor: '#1A0F08', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ position: 'relative', paddingBottom: '100%', overflow: 'hidden' }}>
                          <img 
                            src={post.image_url} 
                            alt={post.title} 
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div style={{ padding: '12px' }}>
                          <h3 style={{ color: 'white', fontWeight: '600', marginBottom: '4px', fontSize: '0.9rem' }}>{post.title}</h3>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#9e9e9e', fontSize: '0.8rem' }}>{new Date(post.created_at).toLocaleDateString()}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Heart size={14} color="#FF5500" />
                              <span style={{ fontSize: '0.8rem', color: '#e0e0e0' }}>{post.likes_count}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {activeTab === 'achievements' && (
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '16px', color: 'white' }}>Trophies</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
                    {achievements.map((achievement) => (
                      <div key={achievement.id} style={{ backgroundColor: '#1A0F08', borderRadius: '8px', padding: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                          <div style={{ height: '56px', width: '56px', backgroundColor: '#FF5500', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {achievement.icon === 'Trophy' && <Trophy size={28} color="white" />}
                            {achievement.icon === 'VideoIcon' && <Camera size={28} color="white" />}
                            {achievement.icon === 'UserPlus' && <User size={28} color="white" />}
                            {achievement.icon === 'Heart' && <Heart size={28} color="white" />}
                            {achievement.icon === 'Bookmark' && <Trophy size={28} color="white" />}
                          </div>
                          <h3 style={{ color: 'white', fontWeight: '600', textAlign: 'center', fontSize: '0.9rem' }}>{achievement.name}</h3>
                          <p style={{ color: '#9e9e9e', fontSize: '0.8rem', textAlign: 'center' }}>{achievement.description}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Trophy size={14} color="#FFD700" />
                            <span style={{ color: '#FFD700' }}>{achievement.points} pts</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {activeTab === 'saved' && (
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '16px', color: 'white' }}>Saved Clipts</h2>
                  {savedCliptsData.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
                      {savedCliptsData.map((clipt) => (
                        <div key={clipt.id} style={{ backgroundColor: '#1A0F08', borderRadius: '8px', overflow: 'hidden' }}>
                          <div style={{ position: 'relative', paddingBottom: '100%', overflow: 'hidden' }}>
                            <img 
                              src={clipt.image_url || "https://placehold.co/600x600/121212/FF5500?text=Saved+Clipt"} 
                              alt={clipt.title || "Saved Clipt"} 
                              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                          <div style={{ padding: '12px' }}>
                            <h3 style={{ color: 'white', fontWeight: '600', marginBottom: '4px', fontSize: '0.9rem' }}>{clipt.title || "Awesome Clipt"}</h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: '#9e9e9e', fontSize: '0.8rem' }}>Saved</span>
                              <Heart size={16} color="#ef4444" fill="#ef4444" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
                      <Heart size={40} color="#666" style={{ marginBottom: '16px' }} />
                      <p style={{ color: '#9e9e9e' }}>No saved clipts yet</p>
                      <button 
                        style={{ 
                          marginTop: '16px', 
                          padding: '8px 16px', 
                          backgroundColor: '#FF5500', 
                          border: 'none',
                          borderRadius: '6px', 
                          color: 'white', 
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                        onClick={() => navigate('/discovery')}
                      >
                        Discover Clipts
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'about' && (
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '16px', color: 'white' }}>About</h2>
                  <div style={{ backgroundColor: '#1A0F08', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                    <p style={{ color: 'white', marginBottom: '16px' }}>{profile?.bio || "No bio available yet."}</p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginTop: '24px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h3 style={{ color: '#FF5500', fontWeight: '600', fontSize: '1rem' }}>Info</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <User color="#FF5500" size={16} />
                          <span style={{ color: '#e0e0e0' }}>Username: @{profile?.username}</span>
                        </div>
                        {profile?.location && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MapPin color="#FF5500" size={16} />
                            <span style={{ color: '#e0e0e0' }}>{profile.location}</span>
                          </div>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h3 style={{ color: '#FF5500', fontWeight: '600', fontSize: '1rem' }}>Stats</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Trophy color="#FF5500" size={16} />
                          <span style={{ color: '#e0e0e0' }}>{achievements.length} Achievements</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Users color="#FF5500" size={16} />
                          <span style={{ color: '#e0e0e0' }}>{followersCount} Followers</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Bottom Navigation - Simplified */}
            <div style={{ 
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '8px 4px',
              backgroundColor: '#1A0F08', 
              borderTop: '1px solid #FF5500',
              zIndex: 50
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <button 
                  style={{
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '6px',
                    color: '#9e9e9e',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate('/clipts')}
                >
                  <Gamepad size={20} />
                  <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>Clipts</span>
                </button>
                
                <button 
                  style={{
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '6px',
                    color: '#9e9e9e',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate('/trophies')}
                >
                  <Medal size={20} />
                  <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>Trophies</span>
                </button>
                
                <button 
                  style={{
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '6px',
                    color: '#9e9e9e',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate('/discovery')}
                >
                  <Clock size={20} />
                  <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>Discover</span>
                </button>
                
                <button 
                  style={{
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '6px',
                    color: isOwnProfile ? '#FF5500' : '#9e9e9e',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onClick={() => navigate(isOwnProfile ? '/profile' : `/profile/${user?.id}`)}
                >
                  {isOwnProfile && (
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      width: '20px',
                      height: '2px',
                      backgroundColor: '#FF5500'
                    }} />
                  )}
                  <User size={20} />
                  <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>Profile</span>
                </button>
                
                <button 
                  style={{
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '6px',
                    color: '#9e9e9e',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate('/messages')}
                >
                  <MessageSquare size={20} />
                  <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>Chat</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Profile;
