import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { RefreshCw } from "lucide-react";
import PostItem from "@/components/PostItem";
import { Post } from "@/types/post"; 
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { toast } from "sonner";
import { debugVideoElement } from "@/utils/debugVideos";
import { getVideoUrlWithProperExtension } from "@/utils/videoUtils";

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

  // Direct fetch function - simplified based on what worked previously
  const fetchPostsDirectly = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching video posts from tat123 only');
      
      // Query for ONLY posts with videos from tat123
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
        .eq('profiles.username', 'tat123')
        .limit(50);
        
      if (error) {
        console.error('Error fetching posts:', error);
        setError(`Database error: ${error.message}`);
        setIsLoading(false);
        return;
      }
      
      console.log(`Query returned ${data?.length || 0} video posts from tat123`);
      
      if (!data || data.length === 0) {
        console.log('No video posts found from tat123');
        setIsLoading(false);
        return;
      }
      
      // Process only posts with videos from tat123
      const processedPosts = data
        .filter(post => post.video_url && post.video_url.trim() !== '')
        .map(async post => {
          // Validate video URL before processing
          const videoUrl = post.video_url?.trim();
          let isValidVideo = false;

          if (videoUrl) {
            try {
              // More reliable validation - test if URL is properly formatted and accessible
              const url = new URL(videoUrl);
              isValidVideo = url.protocol === 'http:' || url.protocol === 'https:';
              
              // Apply formatting and MIME type corrections
              if (isValidVideo) {
                // Process URL to ensure it has proper extension/format 
                post.video_url = getVideoUrlWithProperExtension(videoUrl);
                
                // Log what happened
                if (post.video_url !== videoUrl) {
                  console.log(`Fixed video URL for post ${post.id}:`, {
                    original: videoUrl,
                    fixed: post.video_url
                  });
                }
              }
            } catch (e) {
              console.warn(`Invalid URL format for post ${post.id}: ${videoUrl}`);
            }
          }

          // Always process posts even with invalid URLs - our player has fallbacks
          
          // Fetch trophy count for each post
          const { count: trophyCount, error: trophyError } = await supabase
            .from('clip_votes')
            .select('*', { count: 'exact', head: true})
            .eq('post_id', post.id);
            
          if (trophyError) {
            console.error(`Error fetching trophy count for post ${post.id}:`, trophyError);
          }
          
          return {
            id: post.id,
            content: post.content || "",
            image_url: post.image_url,
            video_url: post.video_url,
            user_id: post.user_id,
            created_at: post.created_at,
            profiles: post.profiles || {
              username: "tat123",
              display_name: "tat123",
              avatar_url: null
            },
            games: post.games || [],
            clip_votes: [{ count: trophyCount || 0 }],
            is_published: true,
            trophy_count: trophyCount || 0
          };
        });
      
      console.log('Video posts from tat123 processed, waiting for trophy counts...');
      
      // Wait for all trophy count fetches to complete
      const completedPosts = await Promise.all(processedPosts);
      
      // Only update state if we still have posts after filtering
      if (completedPosts.length > 0) {
        // Cast retrieved data to ExtendedPost[] to ensure type compatibility
        setRawPosts(completedPosts as unknown as ExtendedPost[]);
        console.log('Posts with trophy counts:', completedPosts);
      } else {
        console.log('No valid video posts from tat123 after filtering');
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Exception fetching posts:', err);
      setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Fullscreen content layout */}
      <div className="h-screen w-screen overflow-hidden relative">
        {/* Floating controls - only visible when needed */}
        <div className="absolute top-4 left-4 z-30">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="bg-black/50 backdrop-blur-sm p-2 rounded-full text-white transition-all duration-300 hover:bg-black/70"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
        </div>
        
        <div className="absolute top-4 right-4 z-30">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              toast.info("Refreshing videos...");
              refreshPosts();
              // Force user interaction for autoplay
              document.documentElement.setAttribute('data-user-interacted', 'true');
            }}
            className={`bg-black/50 backdrop-blur-sm p-2 rounded-full text-white transition-all duration-300 hover:bg-black/70 ${isLoading ? 'animate-spin' : ''}`}
            disabled={isLoading}
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>

        {/* Fullscreen content */}
        <div className="h-screen w-screen overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Button variant="outline" size="icon" className="animate-spin">
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>
        ) : rawPosts.length > 0 ? (
          <div className="h-full">
            {/* Horizontal Scrollable Container - Full Height */}
            <div className="relative overflow-x-auto h-full hide-scrollbar">
              <div className="flex flex-row h-full snap-x snap-mandatory">
                {rawPosts.map((post, index) => (
                  <div key={post.id} className="flex-shrink-0 w-screen h-full snap-center">
                    <div className="h-full w-full">
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
            
            {/* Navigation controls - Sides of the screen */}
            <div className="absolute left-0 right-0 top-0 bottom-0 flex justify-between items-center pointer-events-none z-10">
              <button 
                onClick={() => {
                  setCurrentPostIndex(prev => 
                    prev > 0 ? prev - 1 : rawPosts.length - 1
                  );
                  document.querySelector('.snap-mandatory')?.scrollTo({
                    left: (currentPostIndex - 1) * window.innerWidth,
                    behavior: 'smooth'
                  });
                }}
                className="h-24 w-12 ml-2 bg-gradient-to-r from-purple-900/70 to-indigo-900/70 backdrop-blur-sm rounded-xl pointer-events-auto border border-purple-500/30 shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-all duration-300 hover:shadow-[0_0_25px_rgba(147,51,234,0.5)] hover:border-purple-500/50 active:scale-95"
                aria-label="Previous post"
              >
                <div className="flex justify-center items-center h-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
              </button>
              
              <button 
                onClick={() => {
                  setCurrentPostIndex(prev => 
                    prev < rawPosts.length - 1 ? prev + 1 : 0
                  );
                  document.querySelector('.snap-mandatory')?.scrollTo({
                    left: (currentPostIndex + 1) * window.innerWidth,
                    behavior: 'smooth'
                  });
                }}
                className="h-24 w-12 mr-2 bg-gradient-to-r from-indigo-900/70 to-purple-900/70 backdrop-blur-sm rounded-xl pointer-events-auto border border-purple-500/30 shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-all duration-300 hover:shadow-[0_0_25px_rgba(147,51,234,0.5)] hover:border-purple-500/50 active:scale-95"
                aria-label="Next post"
              >
                <div className="flex justify-center items-center h-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
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
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-400">No clips found</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default Clipts;
