import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { RefreshCw } from "lucide-react";
import PostItem from "@/components/PostItem";
import { Post } from "@/types/post"; 
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";

// Define an extended type that includes our runtime properties
// This allows us to match the expected structure while adding our own properties
type ExtendedPost = Post & {
  trophy_count?: number;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  games?: {
    id: string;
    name: string;
  }[];
};

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
          // Fetch trophy count for each post
          const { count: trophyCount, error: trophyError } = await supabase
            .from('clip_votes')
            .select('*', { count: 'exact', head: true })
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
        setRawPosts(completedPosts);
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
    
    // Set a shorter timeout (3 seconds)
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log('Fetch timeout');
        setIsLoading(false);
      }
    }, 3000);
    
    // Only fetch on first load or manual refresh
    fetchPostsDirectly();
    
    return () => clearTimeout(timeoutId);
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
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id);
              
            return {
              ...post,
              trophy_count: trophyCount || 0,
              clip_votes: [{ count: trophyCount || 0 }]
            };
          })
        );
        
        console.log('Updated trophy counts:', updatedPosts.map(p => ({ id: p.id, count: p.trophy_count })));
        setRawPosts(updatedPosts);
      }
    };
    
    window.addEventListener('trophy-count-update', handleTrophyCountUpdate);
    
    return () => {
      window.removeEventListener('trophy-count-update', handleTrophyCountUpdate);
    };
  }, [rawPosts]);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-between p-4 fixed top-0 w-full z-10 bg-background/80 backdrop-blur-sm">
        <BackButton />
        <h1 className="text-xl font-bold text-primary">Clipts</h1>
        <Button
          onClick={refreshPosts}
          size="icon"
          variant="ghost"
          className="text-primary"
        >
          <RefreshCw className={`h-5 w-5 ${refreshKey > 0 ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="container mx-auto px-4 py-24 max-w-2xl">
        {isLoading && (
          <div className="flex justify-center my-8">
            <div className="animate-pulse">Loading videos...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-white p-4 rounded-lg mb-6">
            <h3 className="font-bold">Error:</h3>
            <p>{error}</p>
            <button 
              onClick={() => fetchPostsDirectly()} 
              className="mt-3 px-3 py-1 bg-purple-700 rounded text-white text-xs"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Video posts */}
        {!isLoading && rawPosts.length > 0 && (
          <div className="space-y-6">
            {rawPosts.map((post) => (
              <div key={`post-${post.id}-${Math.random().toString(36).substring(2, 15)}`} className="mb-6 bg-card rounded-lg overflow-hidden">
                <PostItem key={post.id} post={post} />
              </div>
            ))}
          </div>
        )}

        {/* If no results found */}
        {!isLoading && rawPosts.length === 0 && !error && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-white/60">No videos found from tat123</p>
              <button 
                onClick={() => fetchPostsDirectly()} 
                className="mt-3 px-3 py-1 bg-purple-700 rounded text-white text-xs"
              >
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Clipts;
