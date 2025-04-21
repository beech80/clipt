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
  Calendar,
  Zap, 
  Crown, 
  Star, 
  Target, 
  Award, 
  Gift, 
  Flame,
  Share,
  UserPlus,
  Bookmark
} from 'lucide-react';
import { createGlobalStyle, keyframes } from "styled-components";

// Simplified animations
const pulse = keyframes`
  0% { opacity: 0.7; }
  100% { opacity: 1; }
`;

const indicatorLeft = keyframes`
  0% { transform: rotate(135deg) translateX(0); }
  50% { transform: rotate(135deg) translateX(-3px); }
  100% { transform: rotate(135deg) translateX(0); }
`;

const indicatorRight = keyframes`
  0% { transform: rotate(-45deg) translateX(0); }
  50% { transform: rotate(-45deg) translateX(3px); }
  100% { transform: rotate(-45deg) translateX(0); }
`;

const float = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0); }
`;

const GlobalStyle = createGlobalStyle`
  body {
    background: #121212;
    color: white;
  }
  
  @keyframes pulse {
    0% { opacity: 0.7; }
    100% { opacity: 1; }
  }
  
  @keyframes indicatorLeft {
    0% { transform: rotate(135deg) translateX(0); }
    50% { transform: rotate(135deg) translateX(-3px); }
    100% { transform: rotate(135deg) translateX(0); }
  }
  
  @keyframes indicatorRight {
    0% { transform: rotate(-45deg) translateX(0); }
    50% { transform: rotate(-45deg) translateX(3px); }
    100% { transform: rotate(-45deg) translateX(0); }
  }
  
  @keyframes float {
    0% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
    100% { transform: translateY(0); }
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
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const scrollableRef = useRef<HTMLDivElement>(null);
  
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

  // Comprehensive trophy and achievement system
  const trophies = [
    // 🏆 Trophy & Weekly Top 10 Category
    {
      id: 1,
      name: 'First Taste of Gold',
      description: 'Earn 10 trophies on a post.',
      icon: 'Trophy',
      points: 50,
      progress: 0, // 0% progress
      color: '#FF5500',
      category: 'trophy',
      unlocked: false
    },
    {
      id: 2,
      name: 'Viral Sensation',
      description: 'Get 100 trophies on a single post.',
      icon: 'Flame',
      points: 100,
      progress: 0, // 0% progress
      color: '#FF5500',
      category: 'trophy',
      unlocked: false
    },
    {
      id: 3,
      name: 'Breaking In',
      description: 'Rank in the Top 10 of the weekly leaderboard once.',
      icon: 'Target',
      points: 75,
      progress: 0, // 0% progress
      color: '#FF5500',
      category: 'trophy',
      unlocked: false
    },
    {
      id: 4,
      name: 'Hot Streak',
      description: 'Stay in the Top 10 for 5 weeks in a row.',
      icon: 'Zap',
      points: 200,
      progress: 0, // 0% progress
      color: '#FF5500',
      category: 'trophy',
      unlocked: false
    },
    
    // 📈 Follower Growth Category
    {
      id: 5,
      name: 'Rising Star',
      description: 'Reach 1,000 followers.',
      icon: 'User',
      points: 100,
      progress: 0, // 0% progress
      color: '#FF5500',
      category: 'followers',
      unlocked: false
    },
    {
      id: 6,
      name: 'Influencer Status',
      description: 'Gain 10,000 followers.',
      icon: 'Crown',
      points: 300,
      progress: 0, // 0% progress
      color: '#FF5500',
      category: 'followers',
      unlocked: false
    },
    
    // 🎥 Streaming Subscriber Milestones
    {
      id: 7,
      name: 'First Supporter',
      description: 'Get your first streaming sub.',
      icon: 'Heart',
      points: 50,
      progress: 0, // 0% progress
      color: '#FF5500',
      category: 'streaming',
      unlocked: false
    },
    {
      id: 8,
      name: 'Streaming Star',
      description: 'Reach 100 streaming subscribers.',
      icon: 'Star',
      points: 200,
      progress: 0, // 0% progress
      color: '#FF5500',
      category: 'streaming',
      unlocked: false
    },
    
    // 🤝 Engagement Boosters
    {
      id: 9,
      name: 'Hype Squad',
      description: 'Leave 50 comments on others\'s posts.',
      icon: 'MessageSquare',
      points: 60,
      progress: 0, // 0% progress
      color: '#FF5500',
      category: 'engagement',
      unlocked: false
    },
    {
      id: 10,
      name: 'Super Supporter',
      description: 'Give out 100 trophies.',
      icon: 'Gift',
      points: 90,
      progress: 0, // 0% progress
      color: '#FF5500',
      category: 'engagement',
      unlocked: false
    },
    {
      id: 11,
      name: 'Conversation Starter',
      description: 'Receive 100 replies to your comments.',
      icon: 'MessageSquare',
      points: 120,
      progress: 0, // 0% progress
      color: '#FF5500',
      category: 'engagement',
      unlocked: false
    },
    {
      id: 12,
      name: 'Community Builder',
      description: 'Start a post that gets 500+ comments.',
      icon: 'Users',
      points: 150,
      progress: 0, // 0% progress
      color: '#FF5500',
      category: 'engagement',
      unlocked: false
    },
    
    // 📢 Sharing & Promotion
    {
      id: 13,
      name: 'Signal Booster',
      description: 'Share 10 other creators\' posts.',
      icon: 'Share',
      points: 70,
      progress: 0, // 0% progress
      color: '#FF5500',
      category: 'sharing',
      unlocked: false
    },
    {
      id: 14,
      name: 'Clipt Evangelist',
      description: 'Invite 5 friends to join Clipt.',
      icon: 'UserPlus',
      points: 100,
      progress: 0, // 0% progress
      color: '#FF5500',
      category: 'sharing',
      unlocked: false
    },
    
    // 🎮 Collab & Creator Support
    {
      id: 15,
      name: 'Duo Dynamic',
      description: 'Collab on a post that earns 50 trophies.',
      icon: 'Users',
      points: 100,
      progress: 0, // 0% progress
      color: '#FF5500',
      category: 'collab',
      unlocked: false
    },
    {
      id: 16,
      name: 'Mentor Mode',
      description: 'Help a small creator reach 1,000 followers.',
      icon: 'Award',
      points: 200,
      progress: 0, // 0% progress
      color: '#FF5500',
      category: 'collab',
      unlocked: false
    },
    
    // 🎉 Special & Hidden
    {
      id: 17,
      name: 'OG Clipt Creator',
      description: 'Joined within 3 months of launch.',
      icon: 'Star',
      points: 100,
      progress: 0, // 0% progress
      color: '#FF5500',
      category: 'special',
      unlocked: false
    },
    {
      id: 18,
      name: 'Day One Grinder',
      description: 'Posted on Clipt\'s launch day.',
      icon: 'Calendar',
      points: 150,
      progress: 0, // 0% progress
      color: '#FF5500',
      category: 'special',
      unlocked: false
    },
    {
      id: 19,
      name: 'Mystery Viral',
      description: 'An old post goes viral after 30 days.',
      icon: 'Zap',
      points: 120,
      progress: 0, // 0% progress
      color: '#FF5500',
      category: 'special',
      unlocked: false
    },
    {
      id: 20,
      name: 'Shadow Supporter',
      description: 'Consistently like/comment on someone\'s posts for a month.',
      icon: 'Heart',
      points: 80,
      progress: 0, // 0% progress
      color: '#FF5500',
      category: 'special',
      unlocked: false
    },
  ];
  
  // Load saved trophy progress from local storage
  useEffect(() => {
    const loadTrophyProgress = () => {
      try {
        const savedTrophyData = localStorage.getItem(`trophy_progress_${profileId}`);
        if (savedTrophyData) {
          const parsedData = JSON.parse(savedTrophyData);
          // Merge saved progress with trophy definitions
          const updatedTrophies = trophies.map(trophy => {
            const savedTrophy = parsedData.find((t: any) => t.id === trophy.id);
            if (savedTrophy) {
              return {
                ...trophy,
                progress: savedTrophy.progress,
                unlocked: savedTrophy.unlocked
              };
            }
            return trophy;
          });
          setAchievements(updatedTrophies);
        } else {
          setAchievements(trophies);
        }
      } catch (error) {
        console.error('Error loading trophy data:', error);
        setAchievements(trophies);
      }
    };
    
    loadTrophyProgress();
  }, [profileId]);
  
  // Save trophy progress to local storage
  useEffect(() => {
    if (achievements.length > 0) {
      // Extract only necessary data to save
      const trophyProgressData = achievements.map(trophy => ({
        id: trophy.id,
        progress: trophy.progress,
        unlocked: trophy.unlocked
      }));
      
      try {
        localStorage.setItem(`trophy_progress_${profileId}`, JSON.stringify(trophyProgressData));
      } catch (error) {
        console.error('Error saving trophy data:', error);
      }
    }
  }, [achievements, profileId]);
  
  // Calculate overall achievement progress
  const totalAchievements = trophies.length;
  const achievedCount = achievements.length > 0 
    ? achievements.filter(trophy => trophy.unlocked).length 
    : trophies.filter(trophy => trophy.unlocked).length;
  const overallProgress = Math.round((achievedCount / totalAchievements) * 100);

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
    // Function to update a trophy's progress
  const updateTrophyProgress = (trophyId: number, newProgress: number) => {
    setAchievements(prev => prev.map(trophy => {
      if (trophy.id === trophyId) {
        const updated = {
          ...trophy,
          progress: Math.min(100, newProgress),
          unlocked: newProgress >= 100
        };
        
        if (updated.unlocked && !trophy.unlocked) {
          // Trophy just unlocked - show toast
          toast.success(`Trophy Unlocked: ${trophy.name}`);
        }
        
        return updated;
      }
      return trophy;
    }));
  };
  
  const fetchProfileData = async () => {
      if (!profileId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single();
        
        if (error) {
          setError('Failed to load profile');
          setLoading(false);
          return;
        }
        
        setProfile(data);
        
        // We no longer directly set achievements here because we load from localStorage
        // in the useEffect hook to persist progress across sessions
        
        try {
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
        } catch (error) {
          console.error("Error in fetchProfileData:", error);
          setError(error instanceof Error ? error.message : "An unknown error occurred");
          toast.error("Failed to load profile data");
        } finally {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error in fetchProfileData:", error);
        setError(error instanceof Error ? error.message : "An unknown error occurred");
        toast.error("Failed to load profile data");
      }
    };
    
    fetchProfileData();
  }, [profileId, isOwnProfile]);

  return (
    <>
      <GlobalStyle />
      <AnimatePresence>
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
                <div style={{ textAlign: 'center', position: 'relative' }}>
                  <h1 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '4px' }}>
                    {profile?.display_name || profile?.full_name || profile?.username || 'Gaming Pro'}
                  </h1>
                  <div style={{ color: '#9e9e9e', marginBottom: '8px' }}>@{profile?.username || 'gamer'}</div>
                  <p style={{ color: '#e0e0e0', maxWidth: '400px', marginBottom: '15px' }}>
                    {profile?.bio || 'Professional gamer with a passion for games'}
                  </p>
                  {/* Share Profile Button */}
                  <button
                    onClick={() => setShareModalOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      backgroundColor: '#222',
                      border: '1px solid #FF5500',
                      borderRadius: '20px',
                      padding: '8px 16px',
                      color: 'white',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      marginTop: '8px',
                      marginBottom: '5px',
                      boxShadow: '0 2px 10px rgba(255, 85, 0, 0.15)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Share size={16} color="#FF5500" />
                    Share Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Stats bar */}
            {/* Hidden stats bar */}

            {/* Centered Trophies Header with Trophy Icon & Progress Bar */}
            <div style={{ 
              marginBottom: '24px',
              backgroundColor: '#0A0A0A',
              padding: '16px 10px',
              borderBottom: '1px solid #333',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                backgroundColor: '#1F1200',
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '0 0 15px rgba(255, 85, 0, 0.3)'
              }}>
                <Trophy size={28} color="#FF5500" />
              </div>
              <h2 style={{
                fontSize: '1.3rem',
                fontWeight: 'bold',
                color: 'white',
                margin: 0,
                marginBottom: '5px',
                letterSpacing: '0.5px'
              }}>Trophies</h2>
              
              {/* Overall Achievement Progress Bar */}
              <div style={{
                width: '100%',
                maxWidth: '240px',
                marginTop: '5px',
                marginBottom: '5px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '5px'
                }}>
                  <span style={{
                    fontSize: '0.75rem',
                    color: '#999'
                  }}>
                    Trophy Progress: {achievedCount}/{totalAchievements}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    color: overallProgress >= 50 ? '#FFD700' : '#999'
                  }}>
                    {overallProgress}%
                  </span>
                </div>
                
                {/* Progress Bar Container */}
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#222',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  {/* Progress Bar Fill */}
                  <div style={{
                    width: `${overallProgress}%`,
                    height: '100%',
                    backgroundColor: '#FF5500',
                    borderTopRightRadius: '4px',
                    borderBottomRightRadius: '4px',
                    transition: 'width 0.5s ease-in-out',
                    boxShadow: overallProgress > 0 ? '0 0 8px rgba(255, 85, 0, 0.5)' : 'none'
                  }} />
                </div>
                
                {/* Trophy Rewards */}
                <div style={{
                  fontSize: '0.7rem',
                  color: '#999',
                  marginTop: '5px',
                  textAlign: 'center'
                }}>
                  {overallProgress < 100 ? (
                    `Complete all trophies to unlock exclusive rewards!`
                  ) : (
                    <span style={{ color: '#FFD700' }}>All trophies unlocked! Choose your elite reward!</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Enhanced Trophies Display - Horizontal Scrollable with Progress Rings and Scroll Indicator */}
            <div 
              ref={scrollableRef}
              style={{ 
                position: 'relative',
                marginBottom: '30px', 
                overflowX: 'auto', 
                paddingBottom: '30px',
                paddingTop: '10px',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                background: 'linear-gradient(to right, rgba(30, 15, 8, 0.9), rgba(20, 10, 5, 0.5) 10%, rgba(20, 10, 5, 0.5) 90%, rgba(30, 15, 8, 0.9))',
                borderLeft: '4px solid rgba(255, 85, 0, 0.5)',
                borderRight: '4px solid rgba(255, 85, 0, 0.5)',
                boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.6)',
                borderRadius: '4px'
              }}
            >
              {/* Scroll indicator arrows */}
              <div style={{
                position: 'absolute',
                top: '50%',
                right: '10px',
                transform: 'translateY(-50%)',
                color: '#FF5500',
                fontSize: '20px',
                animation: 'pulse 1s infinite alternate',
                pointerEvents: 'none',
                zIndex: 2
              }}>
                ›
              </div>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '10px',
                transform: 'translateY(-50%)',
                color: '#FF5500',
                fontSize: '20px',
                animation: 'pulse 1s infinite alternate',
                pointerEvents: 'none',
                zIndex: 2
              }}>
                ‹
              </div>
              
              {/* Animated "Scroll for more" indicator */}
              <div style={{
                position: 'absolute',
                bottom: '8px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: '#FF5500',
                fontSize: '12px',
                opacity: 0.8,
                pointerEvents: 'none',
                zIndex: 2,
                whiteSpace: 'nowrap',
                padding: '3px 12px',
                background: 'rgba(30, 15, 5, 0.7)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 85, 0, 0.3)',
                animation: 'pulse 1.5s infinite alternate',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <div style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  borderTop: '2px solid #FF5500',
                  borderRight: '2px solid #FF5500',
                  transform: 'rotate(135deg)',
                  animation: 'indicatorLeft 1s infinite'
                }}></div>
                Swipe to see all trophies
                <div style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  borderTop: '2px solid #FF5500',
                  borderRight: '2px solid #FF5500',
                  transform: 'rotate(-45deg)',
                  animation: 'indicatorRight 1s infinite'
                }}></div>
              </div>
              <div style={{ 
                display: 'flex', 
                gap: '22px', 
                paddingLeft: '16px', 
                paddingRight: '16px',
                minWidth: 'min-content'
              }}>
                {achievements.map((trophy) => (
                  <div 
                    key={trophy.id} 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      minWidth: '110px',
                      opacity: trophy.progress > 0 ? 1 : 0.7,
                      transform: trophy.unlocked ? 'translateY(-5px)' : 'translateY(0)',
                      transition: 'transform 0.3s ease, opacity 0.3s ease',
                      padding: '8px',
                      borderRadius: '8px',
                      background: trophy.unlocked ? 'linear-gradient(to bottom, rgba(255, 85, 0, 0.1), transparent)' : 'transparent',
                      boxShadow: trophy.unlocked ? '0 5px 15px rgba(255, 85, 0, 0.15)' : 'none'
                    }}
                  >
                    {/* Trophy with Progress Ring */}
                    <div style={{
                      position: 'relative',
                      width: '70px',
                      height: '70px',
                      marginBottom: '10px'
                    }}>
                      {/* Circular background */}
                      <div style={{
                        position: 'absolute',
                        width: '60px',
                        height: '60px',
                        top: '5px',
                        left: '5px',
                        borderRadius: '50%',
                        backgroundColor: trophy.progress > 0 ? '#1F1200' : '#1A1A1A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: trophy.unlocked ? '0 0 10px rgba(255, 85, 0, 0.4)' : 'none'
                      }}>
                        {/* Trophy Icon with 3D Effects */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          width: '100%',
                          height: '100%',
                          filter: trophy.unlocked ? 'drop-shadow(0 0 8px rgba(255, 85, 0, 0.7))' : 'none',
                          transform: trophy.unlocked ? 'scale(1.1)' : 'scale(1)',
                          transition: 'transform 0.3s ease, filter 0.3s ease'
                        }}>
                          {trophy.icon === 'Trophy' && 
                            <div style={{ position: 'relative' }}>
                              <Trophy size={32} color={trophy.unlocked ? '#FF5500' : '#777777'} style={{ position: 'relative', zIndex: 2 }} />
                              {trophy.unlocked && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(255,85,0,0.3) 0%, rgba(255,85,0,0) 70%)', filter: 'blur(5px)', borderRadius: '50%', transform: 'scale(1.5)', zIndex: 1 }} />}
                            </div>
                          }
                          {trophy.icon === 'Camera' && 
                            <div style={{ position: 'relative' }}>
                              <Camera size={32} color={trophy.unlocked ? '#FF5500' : '#777777'} style={{ position: 'relative', zIndex: 2 }} />
                              {trophy.unlocked && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(255,85,0,0.3) 0%, rgba(255,85,0,0) 70%)', filter: 'blur(5px)', borderRadius: '50%', transform: 'scale(1.5)', zIndex: 1 }} />}
                            </div>
                          }
                          {trophy.icon === 'User' && 
                            <div style={{ position: 'relative' }}>
                              <User size={32} color={trophy.unlocked ? '#FF5500' : '#777777'} style={{ position: 'relative', zIndex: 2 }} />
                              {trophy.unlocked && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(255,85,0,0.3) 0%, rgba(255,85,0,0) 70%)', filter: 'blur(5px)', borderRadius: '50%', transform: 'scale(1.5)', zIndex: 1 }} />}
                            </div>
                          }
                          {trophy.icon === 'Heart' && 
                            <div style={{ position: 'relative' }}>
                              <Heart size={32} color={trophy.unlocked ? '#FF5500' : '#777777'} style={{ position: 'relative', zIndex: 2 }} />
                              {trophy.unlocked && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(255,85,0,0.3) 0%, rgba(255,85,0,0) 70%)', filter: 'blur(5px)', borderRadius: '50%', transform: 'scale(1.5)', zIndex: 1 }} />}
                            </div>
                          }
                          {trophy.icon === 'Zap' && 
                            <div style={{ position: 'relative' }}>
                              <Zap size={32} color={trophy.unlocked ? '#FF5500' : '#777777'} style={{ position: 'relative', zIndex: 2 }} />
                              {trophy.unlocked && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(255,85,0,0.3) 0%, rgba(255,85,0,0) 70%)', filter: 'blur(5px)', borderRadius: '50%', transform: 'scale(1.5)', zIndex: 1 }} />}
                            </div>
                          }
                          {trophy.icon === 'Crown' && 
                            <div style={{ position: 'relative' }}>
                              <Crown size={32} color={trophy.unlocked ? '#FFD700' : '#777777'} style={{ position: 'relative', zIndex: 2 }} />
                              {trophy.unlocked && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, rgba(255,215,0,0) 70%)', filter: 'blur(5px)', borderRadius: '50%', transform: 'scale(1.5)', zIndex: 1 }} />}
                            </div>
                          }
                          {trophy.icon === 'Star' && 
                            <div style={{ position: 'relative' }}>
                              <Star size={32} color={trophy.unlocked ? '#FFD700' : '#777777'} style={{ position: 'relative', zIndex: 2 }} />
                              {trophy.unlocked && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, rgba(255,215,0,0) 70%)', filter: 'blur(5px)', borderRadius: '50%', transform: 'scale(1.5)', zIndex: 1 }} />}
                            </div>
                          }
                          {trophy.icon === 'Target' && 
                            <div style={{ position: 'relative' }}>
                              <Target size={32} color={trophy.unlocked ? '#FF5500' : '#777777'} style={{ position: 'relative', zIndex: 2 }} />
                              {trophy.unlocked && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(255,85,0,0.3) 0%, rgba(255,85,0,0) 70%)', filter: 'blur(5px)', borderRadius: '50%', transform: 'scale(1.5)', zIndex: 1 }} />}
                            </div>
                          }
                          {trophy.icon === 'Flame' && 
                            <div style={{ position: 'relative' }}>
                              <Flame size={32} color={trophy.unlocked ? '#FF5500' : '#777777'} style={{ position: 'relative', zIndex: 2 }} />
                              {trophy.unlocked && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(255,85,0,0.3) 0%, rgba(255,85,0,0) 70%)', filter: 'blur(5px)', borderRadius: '50%', transform: 'scale(1.5)', zIndex: 1 }} />}
                            </div>
                          }
                          {trophy.icon === 'MessageSquare' && 
                            <div style={{ position: 'relative' }}>
                              <MessageSquare size={32} color={trophy.unlocked ? '#FF5500' : '#777777'} style={{ position: 'relative', zIndex: 2 }} />
                              {trophy.unlocked && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(255,85,0,0.3) 0%, rgba(255,85,0,0) 70%)', filter: 'blur(5px)', borderRadius: '50%', transform: 'scale(1.5)', zIndex: 1 }} />}
                            </div>
                          }
                          {trophy.icon === 'Gift' && 
                            <div style={{ position: 'relative' }}>
                              <Gift size={32} color={trophy.unlocked ? '#FF5500' : '#777777'} style={{ position: 'relative', zIndex: 2 }} />
                              {trophy.unlocked && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(255,85,0,0.3) 0%, rgba(255,85,0,0) 70%)', filter: 'blur(5px)', borderRadius: '50%', transform: 'scale(1.5)', zIndex: 1 }} />}
                            </div>
                          }
                          {trophy.icon === 'Award' && 
                            <div style={{ position: 'relative' }}>
                              <Award size={32} color={trophy.unlocked ? '#FFD700' : '#777777'} style={{ position: 'relative', zIndex: 2 }} />
                              {trophy.unlocked && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, rgba(255,215,0,0) 70%)', filter: 'blur(5px)', borderRadius: '50%', transform: 'scale(1.5)', zIndex: 1 }} />}
                            </div>
                          }
                          {trophy.icon === 'Users' && 
                            <div style={{ position: 'relative' }}>
                              <Users size={32} color={trophy.unlocked ? '#FF5500' : '#777777'} style={{ position: 'relative', zIndex: 2 }} />
                              {trophy.unlocked && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(255,85,0,0.3) 0%, rgba(255,85,0,0) 70%)', filter: 'blur(5px)', borderRadius: '50%', transform: 'scale(1.5)', zIndex: 1 }} />}
                            </div>
                          }
                          {trophy.icon === 'Share' && 
                            <div style={{ position: 'relative' }}>
                              <Share size={32} color={trophy.unlocked ? '#FF5500' : '#777777'} style={{ position: 'relative', zIndex: 2 }} />
                              {trophy.unlocked && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(255,85,0,0.3) 0%, rgba(255,85,0,0) 70%)', filter: 'blur(5px)', borderRadius: '50%', transform: 'scale(1.5)', zIndex: 1 }} />}
                            </div>
                          }
                          {trophy.icon === 'UserPlus' && 
                            <div style={{ position: 'relative' }}>
                              <UserPlus size={32} color={trophy.unlocked ? '#FF5500' : '#777777'} style={{ position: 'relative', zIndex: 2 }} />
                              {trophy.unlocked && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(255,85,0,0.3) 0%, rgba(255,85,0,0) 70%)', filter: 'blur(5px)', borderRadius: '50%', transform: 'scale(1.5)', zIndex: 1 }} />}
                            </div>
                          }
                          {trophy.icon === 'Calendar' && 
                            <div style={{ position: 'relative' }}>
                              <Calendar size={32} color={trophy.unlocked ? '#FF5500' : '#777777'} style={{ position: 'relative', zIndex: 2 }} />
                              {trophy.unlocked && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(255,85,0,0.3) 0%, rgba(255,85,0,0) 70%)', filter: 'blur(5px)', borderRadius: '50%', transform: 'scale(1.5)', zIndex: 1 }} />}
                            </div>
                          }
                        </div>
                      </div>
                      
                      {/* SVG Progress Ring */}
                      <svg width="70" height="70" viewBox="0 0 70 70" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
                        {/* Full circle background (track) */}
                        <circle 
                          cx="35" 
                          cy="35" 
                          r="32" 
                          fill="none" 
                          stroke="#2A2A2A" 
                          strokeWidth="5"
                        />
                        {/* Progress circle */}
                        <circle 
                          cx="35" 
                          cy="35" 
                          r="32" 
                          fill="none" 
                          stroke={trophy.unlocked ? '#FF5500' : '#555555'} 
                          strokeWidth="5"
                          strokeDasharray={`${2 * Math.PI * 32}`}
                          strokeDashoffset={`${2 * Math.PI * 32 * (1 - trophy.progress / 100)}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      
                      {/* Progress percentage - small display for incomplete trophies */}
                      {trophy.progress > 0 && trophy.progress < 100 && (
                        <div style={{
                          position: 'absolute',
                          top: '-5px',
                          right: '-5px',
                          backgroundColor: '#FF5500',
                          color: 'white',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          fontSize: '0.6rem',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          boxShadow: '0 0 6px rgba(0, 0, 0, 0.3)'
                        }}>
                          {trophy.progress}%
                        </div>
                      )}
                    </div>
                    
                    {/* Trophy Name and Points */}
                    <p style={{
                      color: trophy.unlocked ? 'white' : '#AAA',
                      fontSize: '0.75rem',
                      fontWeight: trophy.unlocked ? '600' : '400',
                      textAlign: 'center',
                      margin: '0',
                      marginBottom: '4px'
                    }}>
                      {trophy.name}
                    </p>
                    <p style={{
                      color: trophy.unlocked ? '#FFD700' : '#AA9500',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}>
                      <Trophy size={10} color={trophy.unlocked ? '#FFD700' : '#AA9500'} />
                      {trophy.points} pts
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Share Profile Modal */}
            {shareModalOpen && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000,
                padding: '20px'
              }}>
                <div style={{
                  backgroundColor: '#2A1A12',
                  borderRadius: '12px',
                  width: '90%',
                  maxWidth: '400px',
                  padding: '24px',
                  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 85, 0, 0.3)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{ color: 'white', margin: 0 }}>Share Profile</h3>
                    <button 
                      onClick={() => setShareModalOpen(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#999',
                        fontSize: '20px',
                        cursor: 'pointer'
                      }}
                    >
                      ×
                    </button>
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '15px',
                      padding: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px'
                    }}>
                      <img
                        src={profile?.avatar_url || 'https://i.imgur.com/6VBx3io.png'}
                        alt="Profile"
                        style={{ width: '40px', height: '40px', borderRadius: '20px' }}
                      />
                      <div>
                        <p style={{ margin: 0, color: 'white' }}>{profile?.display_name || profile?.username}</p>
                        <p style={{ margin: 0, color: '#999', fontSize: '12px' }}>{achievedCount} trophies unlocked</p>
                      </div>
                    </div>
                    
                    <p style={{ color: '#EEE', fontSize: '14px' }}>
                      Share this profile with your friends via messages or copy the link to share anywhere.
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText(`${window.location.origin}/profile/${profileId}`);
                          toast.success('Profile link copied to clipboard!');
                        } catch (err) {
                          toast.error('Failed to copy profile link');
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        backgroundColor: '#191919',
                        border: '1px solid #333',
                        borderRadius: '8px',
                        padding: '12px',
                        color: 'white',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      <Link size={18} color="#FF5500" />
                      Copy Profile Link
                    </button>
                    
                    <button
                      onClick={() => {
                        navigate(`/messages?share=${profileId}`);
                        setShareModalOpen(false);
                        toast.success('You can now select a contact to share with');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        backgroundColor: '#FF5500',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      <MessageSquare size={18} />
                      Share via Messages
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                  <Camera size={20} />
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
                  <Bookmark size={20} />
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
                    <Camera size={24} style={{ opacity: 0.8 }} />
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
                      <Camera size={30} color="#555" />
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
                    <Bookmark size={22} style={{ opacity: 0.8 }} />
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
                      <Bookmark size={26} color="#555" />
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
