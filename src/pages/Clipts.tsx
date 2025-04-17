import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { RefreshCw, Heart, Trophy, Bookmark, MessageSquare, Gamepad, ZapOff, Sparkles, Settings } from "lucide-react";
import PostItem from "@/components/PostItem";
import { Post } from "@/types/post"; 
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { toast } from "sonner";
import { debugVideoElement } from "@/utils/debugVideos";
import { getVideoUrlWithProperExtension } from "@/utils/videoUtils";
import '../styles/clipts-effects.css';
import '../styles/clipts-enhanced.css';
import '../styles/navigation-bar.css';
import { motion, AnimatePresence } from "framer-motion";
import NavigationBar from "@/components/NavigationBar";

// Define an extended type that includes our runtime properties
// This allows us to match the expected structure while adding our own properties
interface ExtendedPost extends Post {
  trophy_count?: number;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  username: string;
  display_name: string;
  avatar_url: string | null;
  // The games property should match the Post type definition
  games?: {
    id: string | number;
    name: string;
  };
}

const Clipts = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [refreshKey, setRefreshKey] = useState(0);
  const [rawPosts, setRawPosts] = useState<ExtendedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);

  // Modified fetch function that returns no posts
  const fetchPostsDirectly = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Clipts page is now post-free');
      
      // Set empty posts array immediately
      setTimeout(() => {
        setRawPosts([]);
        setIsLoading(false);
      }, 500); // Short delay to simulate loading
      
      return;
      
      // The following code is commented out to ensure no posts are fetched
      /*
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          image_url,
          video_url,
          user_id,
          created_at,
          post_type,
          is_published,
          profiles (
            username,
            display_name, 
            avatar_url
          ),
          games (
            id,
            name
          )
        `)
        .not('video_url', 'is', null)
        .not('video_url', 'eq', '')
        .eq('is_published', true)
        .limit(50);
      */
      
      // No posts processing needed
      console.log('No posts to process - Clipts page is empty');
    } catch (e) {
      console.error('Error in fetchPostsDirectly:', e);
      setError(`Failed to load posts: ${e instanceof Error ? e.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  }, []);

  // Helper function for sample posts - REMOVED, no longer using sample posts
  const getSamplePosts = useCallback(() => {
    return [];
  }, []);

  // Function to manually refresh posts
  const refreshPosts = useCallback(() => {
    console.log("Manually refreshing posts...");
    setRefreshKey(prev => prev + 1);
    fetchPostsDirectly();
  }, [fetchPostsDirectly]);

  // Auto-refresh posts on load - with very short timeout
  useEffect(() => {
    console.log("Clipts page mounted - simplified version");
    
    // Set a longer timeout (5 seconds) to ensure videos have time to load
    const loadingTimeoutId = setTimeout(() => {
      if (isLoading) {
        console.log('Fetch timeout');
        setIsLoading(false);
      }
    }, 5000);
    
    // Only fetch on first load or manual refresh
    fetchPostsDirectly();

    // Initialize user interaction event for autoplay
    const triggerInteraction = () => {
      document.documentElement.setAttribute('data-user-interacted', 'true');
      console.log('User interaction recorded on Clipts page, videos can now autoplay with sound');
      
      // Trigger a custom event that video elements can listen for
      const userInteractEvent = new CustomEvent('user-interacted');
      document.dispatchEvent(userInteractEvent);
      
      // Force play all videos on the page after user interaction
      document.querySelectorAll('video').forEach(video => {
        if (video.paused) {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.log('Auto-play still prevented after user interaction:', error);
            });
          }
        }
      });
    };

    // Force trigger interaction to help with video playback
    const timeoutId2 = setTimeout(triggerInteraction, 1000);
    
    // More aggressive approach: check and try to play videos every few seconds
    const autoplayInterval = setInterval(() => {
      if (document.documentElement.hasAttribute('data-user-interacted')) {
        document.querySelectorAll('video').forEach(video => {
          if (video.paused) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise.catch(error => {
                // Silent fail is fine here
              });
            }
          }
        });
      }
    }, 3000);

    // Add interaction listeners to help with autoplay
    document.addEventListener('click', triggerInteraction);
    document.addEventListener('touchstart', triggerInteraction);
    document.addEventListener('keydown', triggerInteraction);
    document.addEventListener('scroll', triggerInteraction);
    
    return () => {
      clearTimeout(loadingTimeoutId);
      clearTimeout(timeoutId2);
      clearInterval(autoplayInterval);
      document.removeEventListener('click', triggerInteraction);
      document.removeEventListener('touchstart', triggerInteraction);
      document.removeEventListener('keydown', triggerInteraction);
      document.removeEventListener('scroll', triggerInteraction);
    };
  }, [fetchPostsDirectly, refreshKey]);

  // Set up navigation via the joystick/swipe
  useEffect(() => {
    const handleNavigatePost = (event: Event) => {
      const customEvent = event as CustomEvent;
      const direction = customEvent.detail?.direction;
      
      if (direction === 'prev') {
        const newIndex = currentPostIndex > 0 ? currentPostIndex - 1 : rawPosts.length - 1;
        setCurrentPostIndex(newIndex);
        document.querySelector('.snap-mandatory')?.scrollTo({
          left: newIndex * window.innerWidth,
          behavior: 'smooth'
        });
      } else if (direction === 'next') {
        const newIndex = currentPostIndex < rawPosts.length - 1 ? currentPostIndex + 1 : 0;
        setCurrentPostIndex(newIndex);
        document.querySelector('.snap-mandatory')?.scrollTo({
          left: newIndex * window.innerWidth,
          behavior: 'smooth'
        });
      }
      
      // Force videos to autoplay after navigation
      setTimeout(() => {
        document.documentElement.setAttribute('data-user-interacted', 'true');
        // Try to play the current video
        const videos = document.querySelectorAll('video');
        if (videos.length > 0) {
          videos.forEach((video, idx) => {
            if (idx === currentPostIndex) {
              video.play().catch(err => console.log('Auto-play prevented after navigation:', err));
            } else {
              video.pause();
            }
          });
        }
      }, 300);
    };
    
    // Listen for navigation events from the GameBoy controls
    document.addEventListener('navigatePost', handleNavigatePost);
    
    return () => {
      document.removeEventListener('navigatePost', handleNavigatePost);
    };
  }, [currentPostIndex, rawPosts.length]);

  // Trophy count updates - now actively refreshes trophy counts
  useEffect(() => {
    const handleTrophyCountUpdate = async () => {
      console.log('Trophy count update event received, refreshing trophy counts');
      
      // Refresh trophy counts for all displayed posts without changing the posts array
      if (rawPosts.length > 0) {
        const updatedPosts = await Promise.all(
          rawPosts.map(async post => {
            // Fetch updated trophy count
            const { count: trophyCount } = await supabase
              .from('clip_votes')
              .select('*', { count: 'exact', head: true})
              .eq('post_id', post.id);
              
            return {
              ...post,
              trophy_count: trophyCount || 0,
              clip_votes: [{ count: trophyCount || 0 }]
            };
          })
        );
        
        console.log('Updated trophy counts:', updatedPosts.map(p => ({ id: p.id, count: p.trophy_count })));
        setRawPosts(updatedPosts as unknown as ExtendedPost[]);
      }
    };
    
    window.addEventListener('trophy-count-update', handleTrophyCountUpdate);
    
    return () => {
      window.removeEventListener('trophy-count-update', handleTrophyCountUpdate);
    };
  }, [rawPosts]);

  // Auto-play the current video whenever the current post index changes
  useEffect(() => {
    if (rawPosts.length > 0 && !isLoading) {
      // Force user interaction flag for autoplay
      document.documentElement.setAttribute('data-user-interacted', 'true');
      
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        const videos = document.querySelectorAll('video');
        if (videos.length > 0) {
          videos.forEach((video, idx) => {
            if (idx === currentPostIndex) {
              video.play().catch(err => console.log('Auto-play prevented on index change:', err));
            } else {
              video.pause();
            }
          });
        }
      }, 100);
    }
  }, [currentPostIndex, rawPosts.length, isLoading]);

  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.6 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  };

  const titleVariants = {
    initial: { y: -20, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { delay: 0.2, duration: 0.5 } }
  };

  return (
    <motion.div 
      className="clipts-container min-h-screen relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{ 
        backgroundColor: '#121212',
        color: 'white'
      }}
    >
      {/* Scanline effect */}
      <div className="scanline"></div>
      
      <div className="flex-1 overflow-hidden flex flex-col relative">
        <div className="pt-0 pb-0 px-0 relative overflow-auto hide-scrollbar h-full">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-full retro-loading">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="arcade-frame p-8 mb-6 text-center"
            >
              <h2 className="neon-text-purple text-xl mb-4">LOADING</h2>
              <div className="loading-dots mb-4">
                <motion.div 
                  className="loading-dot" 
                  animate={{ scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
                <motion.div 
                  className="loading-dot" 
                  animate={{ scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div 
                  className="loading-dot" 
                  animate={{ scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                />
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-sm text-cyan-300"
              >
                Loading game data...
              </motion.p>
            </motion.div>
          </div>
        ) : rawPosts.length > 0 ? (
          <div className="h-full">
            {/* Retro-styled title with enhanced effects */}
            <motion.div 
              className="text-center pt-6 pb-4"
              variants={titleVariants}
              initial="hidden"
              animate="visible"
              style={{ position: 'relative' }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255,85,0,0.2) 0%, rgba(255,119,0,0) 70%)',
                  zIndex: 0
                }}
              />
              <h1 className="text-3xl font-bold flex items-center justify-center" style={{
                position: 'relative',
                zIndex: 1
              }}>
                <motion.div
                  animate={{ rotate: [-5, 5, -5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Gamepad className="mr-3 h-6 w-6" style={{ color: '#FF5500' }} />
                </motion.div> 
                <span style={{ 
                  fontWeight: 'bold',
                  background: 'linear-gradient(90deg, #FF5500, #FF7700)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                }}>CLIPTS</span> 
                <motion.div
                  animate={{ rotate: [5, -5, 5], scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="ml-3 h-6 w-6" style={{ color: '#FF7700' }} />
                </motion.div>
              </h1>
              <motion.div 
                className="flex justify-center mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <div style={{
                  height: '2px',
                  width: '120px',
                  background: 'linear-gradient(90deg, rgba(255,85,0,0.3), rgba(255,119,0,0.8), rgba(255,85,0,0.3))',
                  borderRadius: '4px'
                }}></div>
              </motion.div>
            </motion.div>

            {/* Horizontal Scrollable Container - Full Height */}
            <div className="relative overflow-x-auto h-full hide-scrollbar">
              <div className="flex flex-row h-full snap-x snap-mandatory">
                {rawPosts.map((post, index) => (
                  <div key={post.id} className="flex-shrink-0 w-screen h-full snap-center">
                    <div className="h-full flex items-center justify-center">
                      <PostItem 
                        post={post}
                        isCliptsPage={true}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Navigation indicators */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                {rawPosts.map((_, index) => (
                  <div 
                    key={index} 
                    className={`w-2 h-2 rounded-full ${index === currentPostIndex ? 'bg-white' : 'bg-gray-500'}`}
                  />
                ))}
              </div>
            </div>

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
        ) : (
          <motion.div 
            className="flex flex-col justify-center items-center h-full"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div style={{
              backgroundColor: '#2A1A12',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 85, 0, 0.3)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
              position: 'relative',
              maxWidth: '400px',
              width: '100%',
              marginBottom: '24px',
              overflow: 'hidden'
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
                    y: [-2, 2, -2]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ display: 'flex', justifyContent: 'center' }}
                >
                  <ZapOff className="w-16 h-16 mb-4" style={{ color: '#FF5500' }} />
                </motion.div>
                
                <motion.h2 
                  style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    marginBottom: '16px',
                    color: 'white'
                  }}
                  animate={{ 
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  NO SIGNAL
                </motion.h2>
                
                <div style={{
                  marginBottom: '20px',
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
                
                <p style={{
                  color: 'white',
                  textAlign: 'center',
                  fontSize: '18px',
                  marginBottom: '8px'
                }}>The Clipts feed is currently empty.</p>
                
                <p style={{
                  color: '#FF7700',
                  textAlign: 'center',
                  fontSize: '16px',
                  marginTop: '8px',
                  fontWeight: 'bold'
                }}>Create and share your own clips!</p>
              </div>
              
              {/* Decorative dots */}
              <motion.div 
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#FF5500',
                  borderRadius: '50%',
                }}
                animate={{ 
                  opacity: [0.5, 1, 0.5],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              
              <motion.div 
                style={{
                  position: 'absolute',
                  bottom: '4px',
                  left: '4px',
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#FF7700',
                  borderRadius: '50%',
                }}
                animate={{ 
                  opacity: [0.5, 1, 0.5],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.75 }}
              />
            </div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ marginTop: '24px' }}
            >
              <Button 
                onClick={() => navigate('/post-selection')}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(to right, #FF5500, #FF7700)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(255, 85, 0, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <span style={{ 
                  position: 'relative', 
                  zIndex: 10, 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Gamepad className="mr-2 h-6 w-6" />
                  <span>CREATE CLIPT</span>
                </span>
                <motion.span 
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to right, rgba(255, 119, 0, 0.8), rgba(255, 85, 0, 0.8))',
                    opacity: 0,
                    borderRadius: '8px'
                  }}
                  whileHover={{ opacity: 1 }}
                />
              </Button>
            </motion.div>
          </motion.div>
        )}
        </div>
      </div>

      {/* Add the consistent navigation bar */}
      <NavigationBar />
    </motion.div>
  );
};

export default Clipts;
