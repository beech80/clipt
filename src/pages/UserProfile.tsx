import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Loader2, Settings, User, Grid, ListVideo, Trophy, Video, Heart, MessageSquare, FileText, RefreshCw, Share2, MessageCircle, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import achievementService from '@/services/achievementService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { followService } from '@/services/followService';
import { StreamPlayer } from '@/components/streaming/StreamPlayer';
import { Badge } from '@/components/ui/badge';

interface ProfileData {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  banner_url: string;
  bio: string;
  followers_count: number;
  following_count: number;
  achievements_count: number;
  is_following: boolean;
  is_streaming: boolean;
  stream_id: string | null;
  stream_title: string | null;
}

interface Achievement {
  id: string;
  achievement: {
    id: string;
    name: string;
    description: string;
    image?: string;
    target_value?: number;
    reward_type?: 'points' | 'badge' | 'title';
    points?: number;
  };
  completed: boolean;
  currentValue: number;
  user_id: string;
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  post_type: string;
  media_urls: string | string[];
  thumbnail_url?: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  game_id?: string;
  is_published: boolean;
  profiles?: {
    username: string;
    avatar_url: string;
  };
  liked_by_current_user?: boolean;
  comments?: any[];
}

const UserProfile = () => {
  const { username: usernameParam, id: userIdParam } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [clips, setClips] = useState<Post[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [currentUserProfileId, setCurrentUserProfileId] = useState<string | null>(null);

  // Process the profile data from Supabase
  const processProfileData = (rawProfileData: any, userId: string, isFollowing: boolean = false, streamData: any = null): ProfileData => {
    // Check if streaming data exists
    const isStreaming = rawProfileData?.is_streaming === true || streamData !== null;
    
    return {
      id: userId,
      username: rawProfileData?.username || 'user',
      display_name: rawProfileData?.display_name || rawProfileData?.username || 'User',
      avatar_url: rawProfileData?.avatar_url || '',
      banner_url: rawProfileData?.banner_url || 'https://placehold.co/1200x300/0d1b3c/1a237e?text=',
      bio: rawProfileData?.bio || '',
      followers_count: rawProfileData?.followers_count || 0,
      following_count: rawProfileData?.following_count || 0,
      achievements_count: rawProfileData?.achievements_count || 0,
      is_following: isFollowing,
      is_streaming: isStreaming,
      stream_id: streamData?.id || null,
      stream_title: streamData?.title || null,
    };
  };

  const fetchProfileData = async (profileUserId: string) => {
    try {
      setLoading(true);

      let userId = profileUserId || user?.id;

      if (!userId && !userIdParam && user) {
        userId = user.id;
      } else if (!userId) {
        throw new Error('No user ID provided');
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        throw profileError;
      }

      let isFollowing = false;
      if (user && user.id !== userId) {
        const { data: followData, error: followError } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', user.id)
          .eq('following_id', userId)
          .maybeSingle();

        if (!followError) {
          isFollowing = !!followData;
        }
      }

      // Get streaming info if available
      let streamData = null;
      if (profileData?.is_streaming) {
        const { data: streamResult, error: streamError } = await supabase
          .from('streams')
          .select('id, title, viewer_count, started_at')
          .eq('user_id', userId)
          .order('started_at', { ascending: false })
          .limit(1)
          .single();

        if (!streamError && streamResult) {
          streamData = streamResult;
        }
      }

      // Create the processed profile data
      const enhancedProfileData = processProfileData(profileData, userId, isFollowing, streamData);

      // Load posts and achievements
      const loadData = async () => {
        setLoading(true);

        try {
          // Get all posts, regardless of type
          const { data: allPostsData, error: allPostsError } = await supabase
            .from('posts')
            .select('*, profiles(username, avatar_url), likes_count, comments_count')
            .eq('user_id', userId)
            .eq('is_published', true)
            .order('created_at', { ascending: false });

          if (allPostsError) {
            console.error('Error fetching all posts:', allPostsError);
            // If there's an error, set empty arrays and try to create demo content
            setPosts([]);
            setClips([]);
            // Try to create demo content
            await createDemoContent(userId);
          } else {
            // Separate posts and clips, ensuring they match the Post interface
            const processPost = (post: any): Post => {
              let mediaUrls = post.media_urls;
              
              // Handle legacy format where media might be in image_url or video_url
              if (!mediaUrls && (post.image_url || post.video_url)) {
                mediaUrls = post.video_url || post.image_url;
              }
              
              return {
                id: post.id || `temp-${Date.now()}-${Math.random()}`,
                user_id: post.user_id,
                content: post.content || '',
                post_type: post.post_type || 'post',
                media_urls: mediaUrls || [],
                thumbnail_url: post.thumbnail_url || '',
                created_at: post.created_at || new Date().toISOString(),
                likes_count: post.likes_count || 0,
                comments_count: post.comments_count || 0,
                game_id: post.game_id || '',
                is_published: post.is_published !== false,
                profiles: post.profiles,
                liked_by_current_user: false,
                comments: post.comments || []
              };
            };

            if (allPostsData && allPostsData.length > 0) {
              try {
                // Check if data is an array before filtering
                if (Array.isArray(allPostsData)) {
                  const regularPosts = allPostsData
                    .filter(post => post && post.post_type !== 'clipt')
                    .map(processPost);
                  
                  const clipPosts = allPostsData
                    .filter(post => post && post.post_type === 'clipt')
                    .map(processPost);

                  setPosts(regularPosts);
                  setClips(clipPosts);
                } else {
                  // If data is not an array, set empty arrays
                  setPosts([]);
                  setClips([]);
                  // Try to create demo content
                  await createDemoContent(userId);
                }
              } catch (error) {
                console.error("Error processing posts:", error);
                setPosts([]);
                setClips([]);
                // Try to create demo content
                await createDemoContent(userId);
              }
            } else {
              // Only create demo content if the user has no posts at all
              setPosts([]);
              setClips([]);
              await createDemoContent(userId);
            }
          }

          // Load user achievements
          try {
            const userAchievements = await achievementService.getUserAchievements(userId);
            
            // Make sure achievements match our interface
            const processedAchievements = Array.isArray(userAchievements) 
              ? userAchievements.map((achievement: any): Achievement => ({
                  id: achievement.id || `temp-${Date.now()}-${Math.random()}`,
                  achievement: {
                    id: achievement.achievement?.id || '',
                    name: achievement.achievement?.name || 'Achievement',
                    description: achievement.achievement?.description || '',
                    image: achievement.achievement?.image,
                    target_value: achievement.achievement?.target_value,
                    reward_type: achievement.achievement?.reward_type as any,
                    points: achievement.achievement?.points
                  },
                  completed: achievement.completed || false,
                  currentValue: achievement.currentValue || 0,
                  user_id: userId
                }))
              : [];
            
            setAchievements(processedAchievements);
          } catch (error) {
            console.error("Error loading achievements:", error);
            // If real achievements fail to load, use mock achievements
            try {
              const mockAchievements = achievementService.getMockAchievements();
              
              // Convert mock achievements to match our interface
              const processedMockAchievements = Array.isArray(mockAchievements) 
                ? mockAchievements.map((achievement: any): Achievement => ({
                    id: achievement.id || `temp-${Date.now()}-${Math.random()}`,
                    achievement: {
                      id: achievement.achievement?.id || '',
                      name: achievement.achievement?.name || 'Achievement',
                      description: achievement.achievement?.description || '',
                      image: achievement.achievement?.image,
                      target_value: achievement.achievement?.target_value,
                      reward_type: achievement.achievement?.reward_type as any,
                      points: achievement.achievement?.points
                    },
                    completed: achievement.completed || false,
                    currentValue: achievement.currentValue || 0,
                    user_id: userId
                  }))
                : [];
              
              setAchievements(processedMockAchievements);
            } catch (err) {
              console.error("Error loading mock achievements:", err);
              setAchievements([]);
            }
          }
        } catch (error) {
          console.error('Error in loadData:', error);
          toast.error('Failed to load profile data');
          setPosts([]);
          setClips([]);
          setAchievements([]);
        } finally {
          setLoading(false);
        }
      };
      await loadData();

      // Set profile data
      setProfileData(enhancedProfileData);

    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast.error('Failed to load profile data');
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (usernameParam && !userIdParam) {
        setLoading(true);
        try {
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', usernameParam)
            .single();

          if (userError) {
            throw userError;
          }

          if (userData) {
            await fetchProfileData(userData.id);
          } else {
            throw new Error('User not found');
          }
        } catch (error) {
          console.error("Error fetching user by username:", error);
          setLoading(false);
        }
      } else if (userIdParam) {
        await fetchProfileData(userIdParam);
      } else if (user) {
        await fetchProfileData(user.id);
      } else {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [usernameParam, userIdParam, user]);

  const handleFollowToggle = async () => {
    if (!user || !profileData) return;

    try {
      if (profileData.is_following) {
        await followService.unfollow(user.id, profileData.id);
        setProfileData(prev => prev ? {
          ...prev,
          is_following: false,
          followers_count: (prev.followers_count || 0) - 1
        } : null);
        toast.success(`Unfollowed @${profileData.username}`);
      } else {
        await followService.follow(user.id, profileData.id);
        setProfileData(prev => prev ? {
          ...prev,
          is_following: true,
          followers_count: (prev.followers_count || 0) + 1
        } : null);
        toast.success(`Following @${profileData.username}`);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
    }
  };

  const renderPost = (post: Post) => {
    const mediaUrls = typeof post.media_urls === 'string'
      ? [post.media_urls]
      : post.media_urls;

    return (
      <div key={post.id} className="bg-[#121212] rounded-lg overflow-hidden mb-4">
        <div className="p-3 flex items-center space-x-2">
          <Avatar className="h-9 w-9">
            <AvatarImage src={post.profiles?.avatar_url || profileData?.avatar_url} alt={post.profiles?.username || profileData?.username} />
            <AvatarFallback>{(post.profiles?.username || profileData?.username || "").substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-white">{post.profiles?.username || profileData?.username}</div>
            <div className="text-xs text-gray-400">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</div>
          </div>
        </div>
        
        {post.content && <p className="px-3 mb-2 text-gray-200">{post.content}</p>}
        
        {mediaUrls && mediaUrls.length > 0 && (
          <div className="mb-2">
            {mediaUrls.map((url: string, idx: number) => (
              <div key={idx} className="w-full">
                <img
                  src={url}
                  alt={`Post media ${idx + 1}`}
                  className="w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://placehold.co/600x400/0d1b3c/1a237e?text=Media+Not+Available";
                  }}
                />
              </div>
            ))}
          </div>
        )}
        
        <div className="px-3 pb-1 mb-1">
          <div className="flex items-center text-sm text-gray-400">
            <span>{post.likes_count} likes</span>
            <span className="mx-2">•</span>
            <span>{post.comments_count} comments</span>
          </div>
        </div>
        
        <div className="border-t border-gray-800 flex">
          <button className="flex-1 py-2 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition">
            <Heart className={`h-4 w-4 mr-1 ${post.liked_by_current_user ? 'text-red-500 fill-red-500' : ''}`} />
            Like
          </button>
          <button className="flex-1 py-2 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition">
            <MessageSquare className="h-4 w-4 mr-1" />
            Comment
          </button>
          <button className="flex-1 py-2 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition">
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </button>
        </div>
      </div>
    );
  };

  const renderPostsTab = () => {
    if (posts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <FileText className="h-12 w-12 mb-4 text-gray-300" />
          <p>No posts available</p>
        </div>
      );
    }

    return (
      <div className="p-4">
        {posts.map(post => renderPost(post))}
      </div>
    );
  };

  const renderClipsTab = () => {
    if (clips.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Video className="h-12 w-12 mb-4 text-gray-300" />
          <p>No clips available</p>
        </div>
      );
    }

    return (
      <div className="p-4">
        {clips.map(post => renderPost(post))}
      </div>
    );
  };

  // Create demo content if none exists
  const createDemoContent = async (profileId: string) => {
    try {
      if (!profileId) {
        console.error("Cannot create demo content: profileId is missing");
        return;
      }

      console.log("Creating demo posts for user", profileId);

      // Create demo posts (regular and clips)
      const demoPosts = [
        {
          id: `demo-clipt-${Date.now()}`,
          user_id: profileId,
          content: "Check out my latest gaming highlight!",
          post_type: "clipt",
          media_urls: JSON.stringify(["https://placehold.co/600x400/1a237e/ffffff?text=Gaming+Highlight"]),
          thumbnail_url: "https://placehold.co/600x400/1a237e/ffffff?text=Gaming+Highlight",
          created_at: new Date().toISOString(),
          likes_count: Math.floor(Math.random() * 50),
          comments_count: Math.floor(Math.random() * 10),
          game_id: "1",
          is_published: true
        },
        {
          id: `demo-post1-${Date.now()}`,
          user_id: profileId,
          content: "Just finished an amazing gaming session! #gaming #streamer",
          post_type: "post",
          media_urls: JSON.stringify(["https://placehold.co/600x400/4a148c/ffffff?text=Gaming+Session"]),
          created_at: new Date(Date.now() - 86400000).toISOString(),
          likes_count: Math.floor(Math.random() * 50),
          comments_count: Math.floor(Math.random() * 10),
          game_id: "2",
          is_published: true
        },
        {
          id: `demo-post2-${Date.now()}`,
          user_id: profileId,
          content: "My latest gaming setup upgrade! What do you think?",
          post_type: "post",
          media_urls: JSON.stringify([
            "https://placehold.co/600x400/00695c/ffffff?text=Gaming+Setup+1",
            "https://placehold.co/600x400/004d40/ffffff?text=Gaming+Setup+2"
          ]),
          created_at: new Date(Date.now() - 172800000).toISOString(),
          likes_count: Math.floor(Math.random() * 50),
          comments_count: Math.floor(Math.random() * 10),
          game_id: "3",
          is_published: true
        }
      ];

      const { data: createdPosts, error: createError } = await supabase
        .from('posts')
        .insert(demoPosts)
        .select();

      if (createError) {
        console.error("Error creating demo posts:", createError);
        const regularDemoPosts = demoPosts.filter(post => post.post_type !== 'clipt');
        const clipDemoPosts = demoPosts.filter(post => post.post_type === 'clipt');

        setPosts(regularDemoPosts);
        setClips(clipDemoPosts);
      } else {
        console.log("Created demo posts successfully:", createdPosts);

        if (createdPosts) {
          const regularCreatedPosts = createdPosts.filter(post => post.post_type !== 'clipt');
          const clipCreatedPosts = createdPosts.filter(post => post.post_type === 'clipt');

          setPosts(regularCreatedPosts);
          setClips(clipCreatedPosts);
        }
      }
    } catch (error) {
      console.error("Exception creating demo content:", error);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return renderPostsTab();
      case 'clips':
        return renderClipsTab();
      case 'achievements':
        return (
          <div className="p-4">
            {achievements && achievements.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-lg border ${
                      achievement.completed
                        ? 'bg-indigo-900/50 border-indigo-500'
                        : 'bg-gray-800/50 border-gray-700'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 rounded-md overflow-hidden flex-shrink-0 bg-indigo-900 flex items-center justify-center">
                        {achievement.achievement?.image ? (
                          <img
                            src={achievement.achievement.image}
                            alt={achievement.achievement.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://placehold.co/200/311b92/ffffff?text=Achievement";
                            }}
                          />
                        ) : (
                          <Trophy className="h-8 w-8 text-indigo-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold">
                          {achievement.achievement?.name}
                          {achievement.completed && (
                            <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                              COMPLETED
                            </span>
                          )}
                        </h3>
                        <p className="text-gray-300 text-sm mt-1">{achievement.achievement?.description}</p>

                        {/* Progress bar */}
                        {!achievement.completed && achievement.achievement?.target_value && (
                          <div className="mt-2">
                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (achievement.currentValue / achievement.achievement.target_value) * 100
                                  )}%`
                                }}
                              />
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {achievement.currentValue} / {achievement.achievement.target_value}
                            </div>
                          </div>
                        )}

                        {/* Reward */}
                        {achievement.achievement?.reward_type && (
                          <div className="text-xs text-indigo-300 mt-2">
                            {achievement.achievement.reward_type === 'points' && (
                              <span>Reward: {achievement.achievement.points} points</span>
                            )}
                            {achievement.achievement.reward_type === 'badge' && (
                              <span>Reward: Special Badge</span>
                            )}
                            {achievement.achievement.reward_type === 'title' && (
                              <span>Reward: Unique Title</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Trophy className="h-12 w-12 mb-4 text-gray-300" />
                <p>No achievements available</p>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a237e] to-[#0d1b3c] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a237e] to-[#0d1b3c] text-white">
      <div className="w-full relative">
        {/* Banner */}
        <div className="w-full h-[300px] bg-cover bg-center" style={{ backgroundImage: `url('${profileData?.banner_url}')` }} />

        {/* Profile info */}
        <div className="container mx-auto px-4 relative -mt-16">
          <div className="bg-[#1a237e]/70 backdrop-blur-md rounded-lg p-6 border border-indigo-500/30">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-indigo-500">
                  <img
                    src={profileData?.avatar_url || "https://placehold.co/200/1a237e/ffffff?text=User"}
                    alt={profileData?.username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://placehold.co/200/1a237e/ffffff?text=User";
                    }}
                  />
                </div>

                {/* Streaming indicator */}
                {profileData?.is_streaming && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-1 flex items-center gap-1">
                    <span className="animate-pulse rounded-full h-2 w-2 bg-white"></span>
                    LIVE
                  </div>
                )}
              </div>

              {/* User info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold">{profileData?.display_name || profileData?.username}</h1>
                <p className="text-indigo-300 mb-2">@{profileData?.username}</p>

                {/* Stream title if streaming */}
                {profileData?.is_streaming && profileData?.stream_title && (
                  <div className="mb-3 bg-red-500/20 rounded-md p-2 border border-red-500/30">
                    <p className="font-semibold">Currently streaming: {profileData.stream_title}</p>
                    <p className="text-sm">{profileData?.stream_id} viewers</p>
                  </div>
                )}

                <p className="text-sm md:text-base whitespace-pre-wrap">{profileData?.bio || ""}</p>

                <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
                  {/* Follow button or Edit profile button */}
                  {user && user.id === profileData?.id ? (
                    <button
                      onClick={() => navigate("/settings")}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white font-medium transition"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <button
                      onClick={handleFollowToggle}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white font-medium transition"
                    >
                      {profileData?.is_following ? 'Unfollow' : 'Follow'}
                    </button>
                  )}

                  {/* Message button (if not current user) */}
                  {user && user.id !== profileData?.id && (
                    <button className="px-4 py-2 bg-transparent border border-indigo-500 hover:bg-indigo-500/20 rounded-md text-white font-medium transition">
                      Message
                    </button>
                  )}

                  {/* Share profile button */}
                  <button className="px-4 py-2 bg-transparent border border-indigo-500 hover:bg-indigo-500/20 rounded-md text-white font-medium transition">
                    Share Profile
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 text-center mt-4 md:mt-0">
                <div>
                  <div className="text-xl font-bold">
                    {posts.length + clips.length}
                  </div>
                  <div className="text-indigo-300 text-sm">Posts</div>
                </div>
                <div>
                  <div className="text-xl font-bold">{profileData?.followers_count || 0}</div>
                  <div className="text-indigo-300 text-sm">Followers</div>
                </div>
                <div>
                  <div className="text-xl font-bold">{profileData?.following_count || 0}</div>
                  <div className="text-indigo-300 text-sm">Following</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex mb-6 border-b border-white/10">
        <button
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium ${
            activeTab === 'posts'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('posts')}
        >
          <Grid className="h-4 w-4" />
          Posts
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium ${
            activeTab === 'clips'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('clips')}
        >
          <ListVideo className="h-4 w-4" />
          Clipts
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium ${
            activeTab === 'achievements'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('achievements')}
        >
          <Trophy className="h-4 w-4" />
          Trophies
        </button>
      </div>

      {/* Content Area */}
      {renderTabContent()}
    </div>
  );
};

export default UserProfile;
