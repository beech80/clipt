import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, Trophy, Share2, Bookmark, ArrowLeft, Users, SkipForward, SkipBack } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShareButton } from '@/components/ShareButton';
import NavigationBar from '@/components/NavigationBar';
import '../styles/navigation-bar.css';
import { motion } from 'framer-motion';

interface PostType {
  id: string;
  user_id: string;
  content: string;
  media_urls: string[] | string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  trophy_count: number;
  is_published: boolean;
  post_type?: string;
  thumbnail_url?: string;
  image_url?: string | null;
  video_url?: string | null;
  profiles: {
    username: string;
    avatar_url: string;
    display_name?: string;
  } | null;
  liked_by_current_user?: boolean;
}

const SquadsClipts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [initialPostSet, setInitialPostSet] = useState(false);
  const [navigationDirection, setNavigationDirection] = useState<'next' | 'prev' | null>(null);

  // Fetch squad clips
  const { data: squadPosts = [], isLoading, refetch } = useQuery({
    queryKey: ['squad-posts'],
    queryFn: async () => {
      if (!user) return [];
      
      // Get user's squad members from friends table (simplified approach)
      const { data: squadMembers, error: squadError } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted');
        
      if (squadError) {
        console.error("Error fetching squad members:", squadError);
        return [];
      }
      
      // Include current user in the squad
      const squadIds = [...(squadMembers?.map(member => member.friend_id) || []), user.id];
      
      if (squadIds.length === 0) {
        return [];
      }
      
      // Get posts from squad members
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          likes_count,
          comments_count,
          trophy_count,
          is_published,
          post_type,
          media_urls,
          thumbnail_url,
          image_url,
          video_url,
          profiles:user_id (
            username,
            avatar_url,
            display_name
          )
        `)
        .in('user_id', squadIds)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
        
      if (postsError) {
        console.error("Error fetching squad posts:", postsError);
        return [];
      }
      
      // Check which posts are liked by current user
      if (user) {
        const postIds = posts.map(post => post.id);
        const { data: likeData } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds);
        
        const likedPostIds = new Set(likeData?.map(like => like.post_id) || []);
        
        return posts.map(post => ({
          ...post,
          liked_by_current_user: likedPostIds.has(post.id)
        }));
      }
      
      return posts.map(post => ({
        ...post,
        liked_by_current_user: false
      }));
    },
    enabled: !!user,
  });
  
  // Like post mutation
  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user) {
        toast.error("Please sign in to like posts");
        return;
      }
      
      const post = squadPosts.find(p => p.id === postId);
      const isLiked = post?.liked_by_current_user;
      
      if (isLiked) {
        // Unlike post
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
          
        if (error) throw error;
        
        // Decrement likes count
        const { error: updateError } = await supabase.rpc('decrement_likes_count', { post_id: postId });
        if (updateError) throw updateError;
        
        return { action: 'unliked', postId };
      } else {
        // Like post
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            post_id: postId
          });
          
        if (error) throw error;
        
        // Increment likes count
        const { error: updateError } = await supabase.rpc('increment_likes_count', { post_id: postId });
        if (updateError) throw updateError;
        
        return { action: 'liked', postId };
      }
    },
    onSuccess: (result) => {
      // Update query cache
      queryClient.invalidateQueries({ queryKey: ['squad-posts'] });
    },
    onError: (error) => {
      console.error("Error liking post:", error);
      toast.error("Failed to like post");
    }
  });

  // Function to get media URL from post
  const getMediaUrl = (post: PostType) => {
    try {
      // First try media_urls field
      if (post.media_urls) {
        if (typeof post.media_urls === 'string') {
          try {
            // Try to parse JSON string
            const parsed = JSON.parse(post.media_urls);
            return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : post.media_urls;
          } catch (e) {
            // If parsing fails, use the string directly
            return post.media_urls;
          }
        } else if (Array.isArray(post.media_urls) && post.media_urls.length > 0) {
          return post.media_urls[0];
        }
      }

      // Fallback to other fields if not found
      if (post.thumbnail_url) return post.thumbnail_url;
      else if (post.image_url) return post.image_url;
      else if (post.video_url) return post.video_url;
      
      return null;
    } catch (error) {
      console.error("Error getting media URL:", error);
      return null;
    }
  };

  // Navigation between posts
  const handleNavigation = (direction: 'next' | 'prev') => {
    if (squadPosts.length === 0) return;
    
    setNavigationDirection(direction);
    
    if (direction === 'next') {
      setCurrentPostIndex(prevIndex => 
        prevIndex < squadPosts.length - 1 ? prevIndex + 1 : 0
      );
    } else {
      setCurrentPostIndex(prevIndex => 
        prevIndex > 0 ? prevIndex - 1 : squadPosts.length - 1
      );
    }
  };

  // Set initial post when posts are loaded
  useEffect(() => {
    if (squadPosts.length > 0 && !initialPostSet) {
      setCurrentPostIndex(0);
      setInitialPostSet(true);
    }
  }, [squadPosts, initialPostSet]);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNavigation('next');
      } else if (e.key === 'ArrowLeft') {
        handleNavigation('prev');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Optional: Add joystick control hook here if needed
  
  return (
    <div style={{
      backgroundColor: '#121212',
      minHeight: '100vh',
      color: 'white',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <div className="relative overflow-hidden" style={{ height: '100vh', maxHeight: '100vh' }}>
        {/* Fixed header with title */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          backgroundColor: '#121212',
          borderBottom: '1px solid rgba(255, 85, 0, 0.3)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          padding: '12px 0'
        }}>
          <div className="flex justify-center items-center">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  width: '120%',
                  height: '120%',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255,85,0,0.15) 0%, rgba(255,119,0,0) 70%)',
                  zIndex: 0
                }}
              />
              <Users style={{ color: '#FF5500', width: '24px', height: '24px' }} />
              <h1 className="text-xl font-bold text-center" style={{ 
                position: 'relative',
                zIndex: 1,
                background: 'linear-gradient(90deg, #FF5500, #FF7700)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
              }}>
                SQUAD CLIPTS
              </h1>
            </div>
          </div>
        </div>
        
        {/* Main content area */}
        {squadPosts.length > 0 ? (
          <div style={{ paddingTop: '60px', height: 'calc(100vh - 60px)' }}>
            <div className="relative h-full">
              <div className="h-full" style={{ maxHeight: 'calc(100vh - 120px)', overflow: 'hidden', scrollBehavior: 'smooth' }}>
                {/* Only render current post for better performance */}
                {squadPosts.length > 0 && squadPosts[currentPostIndex] && (
                  <div className="h-full">
                    <div className="flex flex-col h-full">
                      {/* Post container */}
                      <div className="flex-1 relative">
                        {/* User info with styled background */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          zIndex: 10,
                          padding: '16px',
                          background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0))',
                        }}>
                          <div style={{
                            display: 'flex', 
                            alignItems: 'center',
                            backgroundColor: 'rgba(42, 26, 18, 0.7)',
                            backdropFilter: 'blur(8px)',
                            padding: '8px 12px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 85, 0, 0.2)',
                          }}>
                            <Avatar style={{
                              width: '42px',
                              height: '42px',
                              border: '2px solid #FF5500',
                              borderRadius: '50%',
                              overflow: 'hidden',
                            }}>
                              <AvatarImage src={squadPosts[currentPostIndex]?.profiles?.avatar_url || ""} />
                              <AvatarFallback style={{
                                backgroundColor: '#2A1A12',
                                color: '#FF7700',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '18px'
                              }}>
                                {squadPosts[currentPostIndex]?.profiles?.username?.charAt(0).toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div style={{ marginLeft: '12px' }}>
                              <div style={{ fontWeight: 'bold', color: 'white' }}>
                                {squadPosts[currentPostIndex]?.profiles?.display_name || 
                                  squadPosts[currentPostIndex]?.profiles?.username || "Anonymous"}
                              </div>
                              <div style={{ fontSize: '12px', color: '#FF7700', opacity: 0.8 }}>
                                {squadPosts[currentPostIndex]?.created_at && 
                                  formatDistanceToNow(new Date(squadPosts[currentPostIndex].created_at), { addSuffix: true })}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Post content */}
                        <div style={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          padding: '16px',
                          paddingTop: '80px',
                          paddingBottom: '80px',
                          maxHeight: 'calc(100vh - 120px)',
                          overflow: 'hidden'
                        }}>
                          {/* Caption with horizontal scroll */}
                          {squadPosts[currentPostIndex]?.content && (
                            <div style={{
                              width: '100%',
                              marginBottom: '16px',
                              overflow: 'hidden',
                              backgroundColor: 'rgba(42, 26, 18, 0.5)',
                              borderRadius: '12px',
                              padding: '12px',
                              border: '1px solid rgba(255, 85, 0, 0.1)',
                              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                            }}>
                              <p style={{ 
                                color: 'white',
                                textAlign: 'center',
                                whiteSpace: 'pre-wrap',
                                maxHeight: '80px',
                                overflow: 'auto',
                                padding: '0 8px'
                              }}>
                                {squadPosts[currentPostIndex].content}
                              </p>
                            </div>
                          )}
                          
                          {/* Media container */}
                          <div style={{ 
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            maxHeight: 'calc(100vh - 220px)',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              position: 'relative',
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {(getMediaUrl(squadPosts[currentPostIndex])?.includes('.mp4') || 
                                getMediaUrl(squadPosts[currentPostIndex])?.includes('.webm')) ? (
                                <video 
                                  src={getMediaUrl(squadPosts[currentPostIndex]) || ''}
                                  controls
                                  style={{
                                    maxHeight: 'calc(100vh - 240px)',
                                    maxWidth: '100%',
                                    objectFit: 'contain',
                                    borderRadius: '8px',
                                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
                                    border: '1px solid rgba(255, 85, 0, 0.2)'
                                  }}
                                  poster={squadPosts[currentPostIndex].thumbnail_url || ''}
                                />
                              ) : (
                                <img 
                                  src={getMediaUrl(squadPosts[currentPostIndex]) || ''}
                                  alt="Post content"
                                  style={{
                                    maxHeight: 'calc(100vh - 240px)',
                                    maxWidth: '100%',
                                    objectFit: 'contain',
                                    borderRadius: '8px',
                                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
                                    border: '1px solid rgba(255, 85, 0, 0.2)'
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Post actions */}
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 10,
                        padding: '16px',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-around',
                          alignItems: 'center',
                          padding: '8px',
                          backgroundColor: 'rgba(42, 26, 18, 0.7)',
                          borderRadius: '16px',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255, 85, 0, 0.2)'
                        }}>
                          <button 
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              background: 'none',
                              border: 'none',
                              color: squadPosts[currentPostIndex].liked_by_current_user ? '#FF5500' : 'white',
                              cursor: 'pointer'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              likeMutation.mutate(squadPosts[currentPostIndex].id);
                            }}
                            disabled={likeMutation.isPending}
                            aria-label="Like post"
                          >
                            <Heart className="h-6 w-6" fill={squadPosts[currentPostIndex].liked_by_current_user ? '#FF5500' : 'none'} />
                            <span style={{ fontSize: '12px', marginTop: '4px' }}>{squadPosts[currentPostIndex].likes_count || 0}</span>
                          </button>
                          
                          <button 
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              background: 'none',
                              border: 'none',
                              color: 'white',
                              cursor: 'pointer'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/post/${squadPosts[currentPostIndex].id}`);
                            }}
                            aria-label="View comments"
                          >
                            <MessageSquare className="h-6 w-6" />
                            <span style={{ fontSize: '12px', marginTop: '4px' }}>{squadPosts[currentPostIndex].comments_count || 0}</span>
                          </button>
                          
                          <button 
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              background: 'none',
                              border: 'none',
                              color: '#FFD700',
                              cursor: 'pointer'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle trophy action here
                              toast.success("Trophy awarded!");
                            }}
                            aria-label="Award trophy"
                          >
                            <Trophy className="h-6 w-6" />
                            <span style={{ fontSize: '12px', marginTop: '4px' }}>{squadPosts[currentPostIndex].trophy_count || 0}</span>
                          </button>
                          
                          <button 
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              background: 'none',
                              border: 'none',
                              color: '#FF7700',
                              cursor: 'pointer'
                            }}
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Share post"
                          >
                            <Share2 className="h-6 w-6" />
                          </button>
                          
                          <button 
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              background: 'none',
                              border: 'none',
                              color: 'white',
                              cursor: 'pointer'
                            }}
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Save post"
                          >
                            <Bookmark className="h-6 w-6" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Navigation indicators */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                {squadPosts.map((_, index) => (
                  <div 
                    key={index} 
                    className={`w-2 h-2 rounded-full ${index === currentPostIndex ? 'bg-white' : 'bg-gray-500'}`}
                    onClick={() => setCurrentPostIndex(index)}
                  />
                ))}
              </div>
              
              {/* Navigation controls with modern styling */}
              <div style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                justifyContent: 'space-between',
                pointerEvents: 'none',
                padding: '0 12px',
                zIndex: 5
              }}>
                <motion.button 
                  onClick={() => handleNavigation('prev')}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(42, 26, 18, 0.8)',
                    border: '1px solid rgba(255, 85, 0, 0.3)',
                    borderRadius: '50%',
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(4px)'
                  }}
                  aria-label="Previous post"
                >
                  <SkipBack style={{ color: '#FF5500' }} />
                </motion.button>
                
                <motion.button 
                  onClick={() => handleNavigation('next')}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(42, 26, 18, 0.8)',
                    border: '1px solid rgba(255, 85, 0, 0.3)',
                    borderRadius: '50%',
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(4px)'
                  }}
                  aria-label="Next post"
                >
                  <SkipForward style={{ color: '#FF5500' }} />
                </motion.button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: 'calc(100vh - 120px)',
            paddingTop: '60px'
          }}>
            <div style={{
              backgroundColor: '#2A1A12',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 85, 0, 0.3)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
              position: 'relative',
              maxWidth: '400px',
              width: '100%',
              overflow: 'hidden',
              textAlign: 'center'
            }}>
              {/* Orange accent bar on the side */}
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '4px',
                background: 'linear-gradient(to bottom, #FF5500, #FF7700)',
                borderRadius: '4px 0 0 4px'
              }}></div>
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <motion.div
                  animate={{ 
                    opacity: [0.7, 1, 0.7],
                    scale: [0.95, 1, 0.95]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}
                >
                  <Users className="w-16 h-16" style={{ color: '#FF5500' }} />
                </motion.div>
                
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  marginBottom: '12px',
                  background: 'linear-gradient(90deg, #FF5500, #FF7700)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>No Squad Clipts Available</h3>
                
                <div style={{
                  marginBottom: '16px',
                  marginTop: '16px',
                  width: '100%',
                  height: '2px',
                  backgroundColor: 'rgba(255, 85, 0, 0.2)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <motion.div 
                    style={{
                      position: 'absolute',
                      height: '100%',
                      background: 'linear-gradient(to right, #FF5500, #FF7700)'
                    }}
                    initial={{ width: '0%', x: '-100%' }}
                    animate={{ width: '100%', x: '100%' }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 3,
                      ease: "linear"
                    }}
                  />
                </div>
                
                <p style={{ color: 'white', fontSize: '16px' }}>Add friends to your squad or create new clipts!</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Add custom CSS for hiding scrollbar but keeping functionality */}
        <style dangerouslySetInnerHTML={{ __html: `
          .hide-scrollbar {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }
          .hide-scrollbar::-webkit-scrollbar {
            display: none;  /* Chrome, Safari and Opera */
          }
        `}} />
      </div>
      
      {/* NavigationBar removed to avoid conflict with GameBoyControls */}
    </div>
  );
};

export default SquadsClipts;
