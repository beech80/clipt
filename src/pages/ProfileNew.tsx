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
import { Gamepad, Medal, Clock, User, MessageSquare, Settings, Users, Heart, Camera, Trophy, Edit, Link, ExternalLink, Mail, MapPin, Calendar } from 'lucide-react';
import { createGlobalStyle, keyframes, css } from "styled-components";

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
              color: 'white'
            }}
          >
            <div style={{ padding: '0' }}>
  {/* --- Profile Header (Arcade/Neon) --- */}

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
  {/* Arcade Neon Profile Header */}
  <div className="arcade-bg-animated" style={{ width: '100%', position: 'relative', marginBottom: '10px', padding: '12px 0 4px', zIndex: 20 }}>
    <div className="arcade-neon-text" style={{ fontSize: '2.1rem', fontWeight: 900, letterSpacing: '2px', textAlign: 'center', lineHeight: 1, marginBottom: '2px', textShadow: '0 0 12px #FF5500, 0 0 24px #FFB000' }}>
      {profile?.display_name || 'User Profile'}
    </div>
    <div style={{ fontFamily: 'monospace', color: '#FFB000', fontSize: '1.1rem', opacity: 0.82, textAlign: 'center', marginBottom: '2px', textShadow: '0 0 8px #FFB000' }}>
      @{profile?.username || 'username'}
    </div>
    {/* Tagline/status */}
    {profile?.tagline && (
      <div style={{ color: '#fff', fontSize: '1rem', opacity: 0.7, fontStyle: 'italic', marginTop: '2px', textShadow: '0 0 6px #FF5500' }}>
        {profile.tagline}
      </div>
    )}
    <div className="arcade-neon-glow" style={{ pointerEvents: 'none' }} />
  </div>
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
                    background: 'rgba(42, 26, 18, 0.7)',
                    backdropFilter: 'blur(5px)',
                    WebkitBackdropFilter: 'blur(5px)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 85, 0, 0.3)',
                    padding: '12px 20px',
                    marginTop: '8px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                    width: '80%',
                    maxWidth: '300px'
                  }}>
                    <h1 style={{ 
                      fontWeight: '800', 
                      fontSize: '1.7rem', 
                      marginBottom: '5px', 
                      color: 'white',
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                      background: 'linear-gradient(90deg, #FF5500, #FF7700)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      display: 'inline-block'
                    }}>
                      {profile?.display_name || profile?.username || "User"}
                    </h1>
                    <p className="text-sm text-white text-opacity-80">
                      {isOwnProfile ? 'Your gaming journey' : 'Their gaming journey'}
                    </p>
                    
                    {profile?.bio && (
                      <div style={{
                        maxWidth: '300px',
                        margin: '10px auto 0',
                        padding: '8px 15px',
                        background: 'rgba(42, 26, 18, 0.7)',
                        backdropFilter: 'blur(5px)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 85, 0, 0.2)',
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
              </div>
              
              <div style={{ padding: '0 20px 20px' }}>
                {/* Stats bar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  width: '100%',
                  marginBottom: '20px',
                  background: 'rgba(42, 26, 18, 0.7)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  padding: '15px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 85, 0, 0.2)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ 
                      fontWeight: 'bold', 
                      fontSize: '20px', 
                      color: 'white',
                      marginBottom: '2px' 
                    }}>{userPosts.length}</p>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#FF7700',
                      fontWeight: '500'
                    }}>Posts</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ 
                      fontWeight: 'bold', 
                      fontSize: '20px', 
                      color: 'white',
                      marginBottom: '2px' 
                    }}>{followersCount}</p>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#FF7700',
                      fontWeight: '500'
                    }}>Followers</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ 
                      fontWeight: 'bold', 
                      fontSize: '20px', 
                      color: 'white',
                      marginBottom: '2px' 
                    }}>{followingCount}</p>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#FF7700',
                      fontWeight: '500'
                    }}>Following</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ 
                      fontWeight: 'bold', 
                      fontSize: '20px', 
                      color: 'white',
                      marginBottom: '2px' 
                    }}>{achievements.length}</p>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#FF7700',
                      fontWeight: '500'
                    }}>Achievements</p>
                  </div>
                </div>

                <RetroArcadeProfile 
                  profile={profile}
                  posts={userPosts}
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
            
            {/* Profile tabs */}
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

            {/* New Direct Profile Top Section */}
            <div className="profile-header-container arcade-bg-animated">
  {/* Animated Arcade/Retro Neon Background */}
  <div className="profile-cover-image">
    <div className="profile-cover-pattern arcade-pixel-pattern"></div>
    <div className="arcade-neon-glow"></div>
  </div>

  {/* User Profile Content */}
  <div className="profile-content glassmorphic-card">
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
          <button className="edit-avatar-button">
            <Camera size={16} />
          </button>
        )}
      </div>
    </div>

    {/* Profile Info */}
    <div className="profile-info">
      <h1 className="profile-name arcade-neon-text">{profile?.full_name || 'Gaming Pro'}</h1>
      <div className="profile-username">@{profile?.username || 'gamer'}</div>
      <p className="profile-bio">
        {profile?.bio || 'Professional gamer with a passion for FPS and strategy games. I stream regularly and love to connect with my fellow gamers! Check out my latest clips and join me on my next stream.'}
      </p>

      {/* Stats Section with Icons */}
      <div className="profile-stats">
        <div className="stat-item animated-stat">
          <Users size={20} className="stat-icon" />
          <div className="stat-value">{followersCount || '12.5K'}</div>
          <div className="stat-label">Followers</div>
        </div>
        <div className="stat-item animated-stat">
          <User size={20} className="stat-icon" />
          <div className="stat-value">{followingCount || '543'}</div>
          <div className="stat-label">Following</div>
        </div>
        <div className="stat-item animated-stat">
          <Camera size={20} className="stat-icon" />
          <div className="stat-value">{userPosts.length || '85'}</div>
          <div className="stat-label">Clips</div>
        </div>
      </div>

      {/* Action Buttons - Arcade Style */}
      <div className="action-buttons">
        {!isOwnProfile ? (
          <>
            <button className="action-button primary-button arcade-glow">
              <Users size={18} />
              Follow
            </button>
            <button className="action-button secondary-button arcade-glow">
              <MessageSquare size={18} />
              Message
            </button>
                      </>
                    ) : (
                      <button className="action-button secondary-button" onClick={() => navigate('/profile/edit')}>
                        <Edit size={18} />
                        Edit Profile
                      </button>
                    )}
                  </div>

                  {/* Profile Details */}
                  <div className="profile-details">
                    {profile?.location && (
                      <div className="detail-item">
                        <MapPin size={18} />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <Link size={18} />
                      <span>twitch.tv/{profile?.username || 'gamer'}</span>
                    </div>
                    <div className="detail-item">
                      <Calendar size={18} />
                      <span>Joined January 2023</span>
                    </div>
                  </div>

                  {/* Achievements Preview */}
                  <div className="achievement-preview">
                    <div className="achievement-header">
                      <div className="achievement-title">
                        <Trophy size={18} />
                        <span>Achievements</span>
                      </div>
                      <div className="view-all">
                        <span>View All</span>
                        <ExternalLink size={14} />
                      </div>
                    </div>
                    <div className="achievements-row">
                      {createSampleAchievements().slice(0, 5).map(achievement => (
                        <div key={achievement.id} className="achievement-card">
                          <div className="achievement-card-icon">
                            <Trophy size={16} />
                          </div>
                          <div className="achievement-card-title">{achievement.name}</div>
                          <div className="achievement-card-points">{achievement.points} pts</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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
