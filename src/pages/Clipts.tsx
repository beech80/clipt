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

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-black text-white pb-20">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-gradient-to-r from-indigo-950 to-purple-900 backdrop-blur-md border-b border-indigo-800 shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <BackButton />
          <div className="flex items-center">
            <span className="text-yellow-400 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
              </svg>
            </span>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">Top 10 Clipts</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              toast.info("Refreshing...");
              refreshPosts();
              document.documentElement.setAttribute('data-user-interacted', 'true');
            }}
            className={`text-white transition-all duration-300 ${isLoading ? 'animate-spin' : ''}`}
            disabled={isLoading}
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main content with padding for fixed header */}
      <div className="pt-20">
        {isLoading ? (
          <div className="flex justify-center items-center h-[60vh]">
            <Button variant="outline" size="icon" className="animate-spin">
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="container mx-auto px-4 py-4 max-w-7xl">
            {/* Tabs - similar to Image 1 */}
            <div className="bg-indigo-950/30 rounded-lg p-2 mb-6 inline-flex">
              <button className="px-4 py-1 rounded-md bg-indigo-700/70 text-white flex items-center mr-2">
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 12L7 8M7 8L11 12M7 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13 16L17 12M17 12L21 16M17 12V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Trending
              </button>
              <button className="px-4 py-1 rounded-md text-indigo-300 flex items-center mr-2">
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                This Week
              </button>
              <button className="px-4 py-1 rounded-md text-indigo-300 flex items-center">
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 15L8.5 8L15.5 8L12 15Z" fill="currentColor"/>
                  <path d="M3 21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12 3L19 10H5L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                All-Time
              </button>
            </div>
            
            {/* Empty grid - just the structure without content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Intentionally empty per user request */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Clipts;
