import React, { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Gamepad, Medal, Clock, User, MessageSquare, Settings, Camera, Trophy, Edit, Heart, Users, UserPlus, Target, Award, Gift, Flame, Bookmark, Crown, Star, Calendar, Zap, Share, Link, Play, Plus, ArrowLeft, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { ShareModal } from "@/components/ShareModal";

export default function ProfileBasic() {
  // Router and auth hooks - these must be called first
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // All state declarations - strictly organized for hook consistency
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [savedCliptsData, setSavedCliptsData] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [activeTab, setActiveTab] = useState('clipts');
  const [showTrophies, setShowTrophies] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  // Derived values using useMemo to avoid recalculation on every render
  const profileId = useMemo(() => id || user?.id || 'default-id', [id, user]);
  const isOwnProfile = useMemo(() => user?.id === profileId, [user, profileId]);
  
  // Trophies and achievements data
  const trophies = useMemo(() => [
    // Trophy & Weekly Top 10
    {
      id: 1,
      name: 'First Taste of Gold',
      description: 'Earn 10 trophies on a post.',
      icon: 'Trophy',
      points: 50,
      progress: 30,
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
      progress: 20,
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
      progress: 100,
      color: '#FF5500',
      category: 'trophy',
      unlocked: true
    },
    {
      id: 4,
      name: 'Hot Streak',
      description: 'Stay in the Top 10 for 5 weeks in a row.',
      icon: 'Flame',
      points: 150,
      progress: 40,
      color: '#FF5500',
      category: 'trophy',
      unlocked: false
    },
    // Follower Growth
    {
      id: 5,
      name: 'Rising Star',
      description: 'Reach 1,000 followers.',
      icon: 'Star',
      points: 100,
      progress: 15,
      color: '#FF5500',
      category: 'followers',
      unlocked: false
    },
    {
      id: 6,
      name: 'Influencer Status',
      description: 'Gain 10,000 followers.',
      icon: 'Crown',
      points: 200,
      progress: 5,
      color: '#FF5500',
      category: 'followers',
      unlocked: false
    },
    // Streaming Subscriber Milestones
    {
      id: 7,
      name: 'First Supporter',
      description: 'Get your first streaming sub.',
      icon: 'Heart',
      points: 50,
      progress: 100,
      color: '#FF5500',
      category: 'streaming',
      unlocked: true
    },
    {
      id: 8,
      name: 'Streaming Star',
      description: 'Reach 100 streaming subscribers.',
      icon: 'Zap',
      points: 150,
      progress: 10,
      color: '#FF5500',
      category: 'streaming',
      unlocked: false
    },
    // Engagement Boosters
    {
      id: 9,
      name: 'Hype Squad',
      description: 'Leave 50 comments on others\'posts.',
      icon: 'MessageSquare',
      points: 75,
      progress: 60,
      color: '#FF5500',
      category: 'engagement',
      unlocked: false
    },
    {
      id: 10,
      name: 'Super Supporter',
      description: 'Give out 100 trophies.',
      icon: 'Trophy',
      points: 100,
      progress: 25,
      color: '#FF5500',
      category: 'engagement',
      unlocked: false
    },
    {
      id: 11,
      name: 'Conversation Starter',
      description: 'Receive 100 replies to your comments.',
      icon: 'MessageSquare',
      points: 100,
      progress: 35,
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
      progress: 10,
      color: '#FF5500',
      category: 'engagement',
      unlocked: false
    },
    // Sharing & Promotion
    {
      id: 13,
      name: 'Signal Booster',
      description: 'Share 10 other creators\' posts.',
      icon: 'Share',
      points: 75,
      progress: 80,
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
      progress: 100,
      color: '#FF5500',
      category: 'sharing',
      unlocked: true
    },
    // Collab & Creator Support
    {
      id: 15,
      name: 'Duo Dynamic',
      description: 'Collab on a post that earns 50 trophies.',
      icon: 'Users',
      points: 100,
      progress: 0,
      color: '#FF5500',
      category: 'collab',
      unlocked: false
    },
    {
      id: 16,
      name: 'Mentor Mode',
      description: 'Help a small creator reach 1,000 followers.',
      icon: 'Award',
      points: 150,
      progress: 0,
      color: '#FF5500',
      category: 'collab',
      unlocked: false
    },
    // Special & Hidden
    {
      id: 17,
      name: 'OG Clipt Creator',
      description: 'Joined within 3 months of launch.',
      icon: 'Award',
      points: 100,
      progress: 100,
      color: '#FF5500',
      category: 'special',
      unlocked: true
    },
    {
      id: 18,
      name: 'Day One Grinder',
      description: 'Posted on Clipt\'s launch day.',
      icon: 'Calendar',
      points: 100,
      progress: 0,
      color: '#FF5500',
      category: 'special',
      unlocked: false
    },
    {
      id: 19,
      name: 'Mystery Viral',
      description: 'An old post goes viral after 30 days.',
      icon: 'Zap',
      points: 75,
      progress: 0,
      color: '#FF5500',
      category: 'special',
      unlocked: false
    },
    {
      id: 20,
      name: 'Shadow Supporter',
      description: 'Consistently like/comment on someone\'s posts for a month.',
      icon: 'Heart',
      points: 75,
      progress: 20,
      color: '#FF5500',
      category: 'special',
      unlocked: false
    }
  ], []);
  
  // Calculate achievement progress
  const totalAchievements = trophies.length;
  const achievedCount = trophies.filter(trophy => trophy.unlocked).length;
  const overallProgress = Math.round((achievedCount / totalAchievements) * 100);
  
  // Fetch profile data function using useCallback for referential stability
  const fetchProfile = useCallback(async () => {
    console.log("Fetching profile with ID:", profileId);
    if (!profileId) return;
    
    setLoading(true);
    
    // Create a fallback profile
    const fallbackProfile = {
      id: profileId,
      username: 'user_' + (profileId ? profileId.substring(0, 5) : 'default'),
      avatar_url: 'https://placehold.co/400x400/121212/FF5500?text=User',
      bio: 'Gaming enthusiast and achievement collector',
      display_name: 'Gamer ' + (profileId ? profileId.substring(0, 5) : 'Default'),
      created_at: new Date().toISOString(),
    };
    
    try {
      if (!profileId || profileId === 'undefined' || profileId === 'null') {
        console.warn("Invalid profile ID, using fallback");
        setProfile(fallbackProfile);
        setLoading(false);
        return;
      }
      
      // Query Supabase for the profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();
      
      if (error) {
        console.warn("Profile fetch error, using fallback:", error);
        setProfile(fallbackProfile);
      } else if (!data) {
        console.warn("No profile data returned, using fallback");
        setProfile(fallbackProfile);
      } else {
        console.log("Profile data received:", data);
        setProfile(data);
      }
      
      // Sample posts for demonstration
      const samplePosts = [
        {
          id: 1,
          title: 'Epic Victory Royale',
          image_url: 'https://placehold.co/400x400/121212/FF5500?text=Gaming',
          likes: 42,
          comments: 7,
          is_video: true,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          title: 'New Personal Record',
          image_url: 'https://placehold.co/400x400/121212/FF5500?text=Achievement',
          likes: 21,
          comments: 3,
          is_video: false,
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          title: 'Awesome Team Play',
          image_url: 'https://placehold.co/400x400/121212/FF5500?text=Team',
          likes: 33,
          comments: 5,
          is_video: true,
          created_at: new Date().toISOString()
        },
        {
          id: 4,
          title: 'Check Out This Move',
          image_url: 'https://placehold.co/400x400/121212/FF5500?text=Skills',
          likes: 18,
          comments: 2,
          is_video: true,
          created_at: new Date().toISOString()
        }
      ];
      setUserPosts(samplePosts);
      
      // Sample saved posts
      const sampleSaved = [
        {
          id: 1,
          title: 'Pro Strats',
          image_url: 'https://placehold.co/400x400/121212/FF5500?text=Saved',
          saved_date: '2 days ago'
        },
        {
          id: 2,
          title: 'Tournament Highlights',
          image_url: 'https://placehold.co/400x400/121212/FF5500?text=Tournament',
          saved_date: '1 week ago'
        }
      ];
      setSavedCliptsData(sampleSaved);
      
      // Set follower counts to zero
      setFollowersCount(0);
      setFollowingCount(0);
    } catch (err) {
      console.error("Unexpected error in profile fetch:", err);
      setProfile(fallbackProfile);
      setError("Failed to load profile. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [profileId]);
  
  // Handler functions with useCallback
  const navigateToNextPost = useCallback(() => {
    if (!selectedPost || !userPosts.length) return;
    const currentIndex = userPosts.findIndex(post => post.id === selectedPost.id);
    const nextIndex = (currentIndex + 1) % userPosts.length;
    setSelectedPost(userPosts[nextIndex]);
  }, [selectedPost, userPosts]);
  
  const navigateToPrevPost = useCallback(() => {
    if (!selectedPost || !userPosts.length) return;
    const currentIndex = userPosts.findIndex(post => post.id === selectedPost.id);
    const prevIndex = (currentIndex - 1 + userPosts.length) % userPosts.length;
    setSelectedPost(userPosts[prevIndex]);
  }, [selectedPost, userPosts]);
  
  const closePostDetail = useCallback(() => {
    setShowPostDetail(false);
    setSelectedPost(null);
  }, []);
  
  // Effect to fetch profile data on mount or when profileId changes
  useEffect(() => {
    const failSafeTimer = setTimeout(() => {
      if (loading) {
        console.log("FAILSAFE: Loading stuck for too long, forcing it to complete");
        setLoading(false);
      }
    }, 5000);
    
    fetchProfile();
    
    return () => clearTimeout(failSafeTimer);
  }, [fetchProfile]);
  
  // Loading screen
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="text-center">
          <h2 className="text-xl text-orange-500 mb-4">Loading Profile...</h2>
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }
  
  // Error screen
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-black p-4">
        <div className="text-center">
          <h2 className="text-xl text-red-500 mb-4">Error Loading Profile</h2>
          <p className="text-white mb-4">{error}</p>
          <Button 
            className="bg-gray-800 hover:bg-gray-700" 
            onClick={() => fetchProfile()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  // Main profile UI
  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Profile Hero Section */}
      <div className="bg-gradient-to-b from-gray-900 to-black pt-16 pb-10 relative">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col items-center">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-800 mb-3 border-2 border-orange-500">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile?.username || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <User size={40} className="text-gray-400" />
                </div>
              )}
            </div>
            
            {/* User Info - Hidden as requested */}
            <div className="hidden">
              <h1 className="text-2xl font-bold mb-1">{profile?.display_name || profile?.username || 'Username'}</h1>
              <p className="text-sm text-gray-400 mb-3">@{profile?.username || 'username'}</p>
              <p className="text-center text-sm text-gray-300 max-w-md mb-4">{profile?.bio || 'No bio yet'}</p>
            </div>
            
            {/* Stats Row */}
            <div className="flex items-center justify-center space-x-6 mb-5">
              <div className="flex flex-col items-center">
                <span className="text-lg font-semibold">{userPosts.length}</span>
                <span className="text-xs text-gray-400">Posts</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-lg font-semibold">{followersCount}</span>
                <span className="text-xs text-gray-400">Followers</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-lg font-semibold">{followingCount}</span>
                <span className="text-xs text-gray-400">Following</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-lg font-semibold">{achievedCount}</span>
                <span className="text-xs text-gray-400">Trophies</span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-2">
              {isOwnProfile ? (
                <Button
                  onClick={() => navigate('/settings/profile')} 
                  className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center"
                >
                  <Edit size={16} className="mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <Button 
                  className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center"
                >
                  <UserPlus size={16} className="mr-2" />
                  Follow
                </Button>
              )}
              
              <Button 
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center"
                onClick={() => setShowTrophies(!showTrophies)}
              >
                <Trophy size={16} className="mr-2 text-gray-400" />
                Trophies ({achievedCount}/{totalAchievements})
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Achievements Section - Collapsible */}
      {showTrophies && (
        <div className="mb-6 px-4 py-6 bg-gray-900">
          <div className="max-w-4xl mx-auto">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center">
                <Trophy size={20} className="mr-2 text-gray-400" />
                Achievements
              </h2>
              <div className="flex items-center text-sm">
                <div className="w-32 h-2 rounded-full bg-gray-800 overflow-hidden mr-2">
                  <div 
                    className="h-full bg-gray-400" 
                    style={{ width: `${overallProgress}%` }}
                  ></div>
                </div>
                <span className="text-gray-300">{overallProgress}%</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {trophies.map((achievement, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-md border ${achievement.unlocked ? 'border-gray-400/30 bg-gray-400/10' : 'border-gray-700 bg-gray-800/50'}`}
                >
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center ${achievement.unlocked ? 'bg-gray-400' : 'bg-gray-700'} mr-3`}>
                      {achievement.icon === 'Trophy' && <Trophy size={20} />}
                      {achievement.icon === 'Star' && <Star size={20} />}
                      {achievement.icon === 'Flame' && <Flame size={20} />}
                      {achievement.icon === 'Crown' && <Crown size={20} />}
                      {achievement.icon === 'Zap' && <Zap size={20} />}
                      {achievement.icon === 'Heart' && <Heart size={20} />}
                      {achievement.icon === 'Target' && <Target size={20} />}
                      {achievement.icon === 'User' && <User size={20} />}
                      {achievement.icon === 'UserPlus' && <UserPlus size={20} />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium flex items-center">{achievement.name}</h3>
                      <p className="text-xs text-gray-400">{achievement.description}</p>
                    </div>
                    <div className="text-xs font-semibold ml-2">
                      <div className="mb-1 text-right">{achievement.points} pts</div>
                      <div className="w-16 h-1 rounded-full bg-gray-700 overflow-hidden">
                        <div 
                          className="h-full bg-gray-400" 
                          style={{ width: `${achievement.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Tabs and Content */}
      <div className="max-w-4xl mx-auto px-4 pt-4 pb-20 min-h-[50vh]">
        {/* Simple tabs */}
        <div className="flex border-b border-gray-800 mb-6">
          <button
            className={`pb-2 px-4 text-sm font-medium text-white ${activeTab === 'clipts' ? 'border-b-2 border-gray-400' : ''}`}
            onClick={() => setActiveTab('clipts')}
          >
            Posts
          </button>
          <button
            className={`pb-2 px-4 text-sm font-medium text-white ${activeTab === 'saved' ? 'border-b-2 border-gray-400' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            Saved
          </button>
        </div>
        
        {/* Posts grid */}
        {activeTab === 'clipts' && (
          <div>
            {userPosts.length === 0 ? (
              <div className="text-center py-10">
                <Camera size={40} className="mx-auto mb-3 text-gray-600" />
                <p className="text-gray-400">No posts yet</p>
                {isOwnProfile && (
                  <Button className="mt-4 bg-gray-800 hover:bg-gray-700 text-white">
                    <Plus size={16} className="mr-1 text-gray-400" />
                    Create Post
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {userPosts.map((post, index) => (
                  <div 
                    key={index} 
                    className="aspect-square bg-gray-800 cursor-pointer relative"
                    onClick={() => {
                      setSelectedPost(post);
                      setShowPostDetail(true);
                    }}
                    onDoubleClick={() => {
                      toast.success('Post liked!');
                    }}
                  >
                    {post.image_url ? (
                      <img 
                        src={post.image_url} 
                        alt={post.title || 'Post'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Gamepad size={24} className="text-gray-400 opacity-50" />
                      </div>
                    )}
                    
                    {post.is_video && (
                      <div className="absolute bottom-2 right-2 bg-black/70 rounded-full p-1">
                        <Play size={16} className="text-white" fill="white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Saved posts */}
        {activeTab === 'saved' && (
          <div>
            {savedCliptsData.length === 0 ? (
              <div className="text-center py-10">
                <Bookmark size={40} className="mx-auto mb-3 text-gray-400" />
                <p className="text-gray-400">No saved posts yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {savedCliptsData.map((post, index) => (
                  <div 
                    key={index} 
                    className="aspect-square bg-gray-800 cursor-pointer relative"
                  >
                    {post.image_url ? (
                      <img 
                        src={post.image_url} 
                        alt={post.title || 'Saved Post'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Bookmark size={24} className="text-gray-400 opacity-50" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <div className="text-xs bg-black/70 rounded px-2 py-1 text-gray-300">
                        {post.saved_date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Post Detail Modal */}
      {showPostDetail && selectedPost && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full bg-gray-900 rounded-lg overflow-hidden relative">
            <button 
              className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full"
              onClick={closePostDetail}
            >
              <ArrowLeft size={20} />
            </button>
            
            <div className="flex flex-col md:flex-row">
              {/* Media */}
              <div className="w-full md:w-2/3 aspect-square relative bg-black">
                {selectedPost.image_url ? (
                  <img 
                    src={selectedPost.image_url}
                    alt={selectedPost.title || 'Post'} 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Gamepad size={40} className="text-gray-400 opacity-50" />
                  </div>
                )}
                
                {selectedPost.is_video && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play size={50} className="text-white opacity-80" />
                  </div>
                )}
                
                {/* Navigation arrows */}
                <button 
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white"
                  onClick={navigateToPrevPost}
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white"
                  onClick={navigateToNextPost}
                >
                  <ChevronRight size={24} />
                </button>
              </div>
              
              {/* Info */}
              <div className="w-full md:w-1/3 p-4 flex flex-col">
                <h3 className="text-xl font-bold mb-2">{selectedPost.title}</h3>
                
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800">
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt={profile?.username || 'User'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User size={20} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{profile?.display_name || profile?.username || 'User'}</p>
                    <p className="text-xs text-gray-400">@{profile?.username || 'username'}</p>
                  </div>
                </div>
                
                {/* Engagement stats - interactive */}
                <div className="flex space-x-4 mb-4">
                  <button 
                    className="flex items-center hover:text-gray-300 transition-colors"
                    onClick={() => {
                      // Like functionality
                      toast.success('Post liked!');
                    }}
                  >
                    <Heart size={18} className="mr-1 text-white" />
                    <span className="text-sm">{selectedPost.likes}</span>
                  </button>
                  <button 
                    className="flex items-center hover:text-gray-300 transition-colors"
                    onClick={() => {
                      // Trophy functionality
                      toast.success('Trophy given to post!');
                    }}
                  >
                    <Trophy size={18} className="mr-1 text-white" />
                    <span className="text-sm">{Math.floor(Math.random() * 20)}</span>
                  </button>
                  <button 
                    className="flex items-center hover:text-gray-300 transition-colors"
                    onClick={() => {
                      // Show share options
                      setShowShareOptions(!showShareOptions);
                    }}
                  >
                    <Share size={18} className="mr-1 text-white" />
                    <span className="text-sm">{Math.floor(Math.random() * 5)}</span>
                  </button>
                  
                  {/* Share options popup */}
                  {showShareOptions && (
                    <div className="absolute right-0 mt-16 bg-gray-800 rounded-md shadow-lg p-2 z-10 w-48">
                      <div className="text-xs font-medium text-white mb-2 px-2">Share via</div>
                      <button 
                        className="w-full text-left px-2 py-1.5 text-sm text-white hover:bg-gray-700 rounded flex items-center"
                        onClick={() => {
                          toast.success('Shared on Twitter!');
                          setShowShareOptions(false);
                        }}
                      >
                        <svg className="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="white">
                          <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"></path>
                        </svg>
                        Twitter
                      </button>
                      <button 
                        className="w-full text-left px-2 py-1.5 text-sm text-white hover:bg-gray-700 rounded flex items-center"
                        onClick={() => {
                          toast.success('Shared on Facebook!');
                          setShowShareOptions(false);
                        }}
                      >
                        <svg className="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="white">
                          <path d="M20 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h8.615v-6.96h-2.338v-2.725h2.338v-2c0-2.325 1.42-3.592 3.5-3.592.699-.002 1.399.034 2.095.107v2.42h-1.435c-1.128 0-1.348.538-1.348 1.325v1.735h2.697l-.35 2.725h-2.348V21H20a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1z"></path>
                        </svg>
                        Facebook
                      </button>
                      <button 
                        className="w-full text-left px-2 py-1.5 text-sm text-white hover:bg-gray-700 rounded flex items-center"
                        onClick={() => {
                          setShareModalOpen(true);
                          setShowShareOptions(false);
                        }}
                      >
                        <MessageSquare size={16} className="mr-2" />
                        Messages
                      </button>
                      <button 
                        className="w-full text-left px-2 py-1.5 text-sm text-white hover:bg-gray-700 rounded flex items-center"
                        onClick={() => {
                          toast.success('Copied link to clipboard!');
                          setShowShareOptions(false);
                        }}
                      >
                        <Link size={16} className="mr-2" />
                        Copy Link
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Date */}
                <div className="text-xs text-gray-400 flex items-center mb-4">
                  <Clock size={14} className="mr-1" />
                  {new Date(selectedPost.created_at).toLocaleDateString()}
                </div>
                
                {/* Comments section */}
                <div className="border-t border-gray-800 pt-4 mb-4">
                  <h4 className="text-sm font-medium mb-3 flex items-center">
                    <MessageSquare size={16} className="mr-2 text-gray-400" />
                    Comments ({selectedPost.comments || 0})
                  </h4>
                  
                  {/* Comment list */}
                  <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
                    {[...Array(selectedPost.comments || 3)].map((_, index) => (
                      <div key={index} className="flex space-x-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                          <div className="w-full h-full flex items-center justify-center">
                            <User size={14} className="text-gray-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center">
                            <button 
                              className="text-xs font-medium hover:text-gray-300"
                              onClick={() => {
                                // Navigate to user profile
                                toast.info(`Navigating to User${index + 1}'s profile`);
                                // In a real app this would use navigate(`/profile/${userId}`)
                              }}
                            >
                              User{index + 1}
                            </button>
                            <p className="text-xs text-gray-500 ml-2">{index + 1}d ago</p>
                          </div>
                          <p className="text-xs text-gray-300">Great post! {index === 0 ? 'This is awesome gameplay.' : index === 1 ? 'How did you pull off that move?' : 'Can we play together sometime?'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Add comment */}
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                      <div className="w-full h-full flex items-center justify-center">
                        <User size={14} className="text-gray-400" />
                      </div>
                    </div>
                    <div className="flex-1 relative">
                      <input 
                        type="text" 
                        placeholder="Add a comment..." 
                        className="w-full bg-gray-800 text-white text-sm rounded-full py-2 px-4 focus:outline-none focus:ring-1 focus:ring-gray-400"
                      />
                      <button 
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:text-gray-300"
                        onClick={() => {
                          toast.success('Comment posted!');
                        }}
                      >
                        <Send size={16} className="text-white" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* More posts from this user */}
                <div className="mt-auto">
                  <h4 className="text-sm font-medium mb-2">More from this user</h4>
                  <div className="grid grid-cols-3 gap-1">
                    {userPosts.slice(0, 3).map((post, index) => (
                      <div 
                        key={index} 
                        className="aspect-square bg-gray-800 cursor-pointer"
                        onClick={() => setSelectedPost(post)}
                      >
                        {post.image_url ? (
                          <img 
                            src={post.image_url} 
                            alt={post.title || 'Post'} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Gamepad size={16} className="text-orange-500 opacity-50" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Bottom navigation removed as requested */}
      
      {/* Use the separate ShareModal component */}
      <ShareModal 
        isOpen={shareModalOpen} 
        onClose={() => setShareModalOpen(false)} 
        post={selectedPost} 
        username={profile?.username} 
      />
    </div>
  );
}
