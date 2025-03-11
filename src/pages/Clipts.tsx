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
      console.log('Fetching posts directly - simplified approach');
      
      // Use the most basic query possible, matching previous working version
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('is_published', true)
        .limit(50);
        
      if (error) {
        console.error('Error fetching posts:', error);
        setError(`Database error: ${error.message}`);
        setIsLoading(false);
        
        // Add fallback posts for testing UI
        setRawPosts(getSamplePosts());
        return;
      }
      
      console.log(`Query returned ${data?.length || 0} posts`);
      
      if (!data || data.length === 0) {
        console.log('No posts found, using sample posts');
        setRawPosts(getSamplePosts());
        setIsLoading(false);
        return;
      }
      
      // Very simple post processing - just make sure they're formatted correctly
      const processedPosts = data.map(post => ({
        id: post.id,
        content: post.content || "",
        image_url: post.image_url,
        video_url: post.video_url,
        user_id: post.user_id,
        created_at: post.created_at,
        profiles: post.profiles || {
          username: "unknown",
          display_name: "Unknown User",
          avatar_url: null
        },
        games: post.games,
        clip_votes: [{ count: 0 }],
        is_published: true,
        trophy_count: 0
      }));
      
      console.log('Posts processed successfully');
      setRawPosts(processedPosts);
      setIsLoading(false);
    } catch (err) {
      console.error('Exception fetching posts:', err);
      setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
      
      // Always show something, even on error
      setRawPosts(getSamplePosts());
    }
  }, []);

  // Helper function for sample posts
  const getSamplePosts = useCallback(() => {
    return [
      {
        id: "sample1",
        content: "Sample post 1",
        image_url: "https://picsum.photos/seed/sample1/600/400",
        video_url: null,
        user_id: "system",
        created_at: new Date().toISOString(),
        profiles: {
          username: "system",
          display_name: "Sample User",
          avatar_url: null
        },
        games: null,
        clip_votes: [{ count: 3 }],
        is_published: true,
        trophy_count: 3
      },
      {
        id: "sample2",
        content: "Sample post 2 with video",
        image_url: null,
        video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
        user_id: "system",
        created_at: new Date().toISOString(),
        profiles: {
          username: "system",
          display_name: "Sample User",
          avatar_url: null
        },
        games: null,
        clip_votes: [{ count: 5 }],
        is_published: true,
        trophy_count: 5
      }
    ];
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
        console.log('Fetch timeout - using sample posts');
        setIsLoading(false);
        setRawPosts(getSamplePosts());
      }
    }, 3000);
    
    fetchPostsDirectly();
    
    return () => clearTimeout(timeoutId);
  }, [fetchPostsDirectly, refreshKey, isLoading, getSamplePosts]);

  // Trophy count updates - simplified to just refresh
  useEffect(() => {
    const handleTrophyCountUpdate = () => {
      console.log('Trophy count update - refreshing');
      setRefreshKey(prev => prev + 1);
    };
    
    window.addEventListener('trophy-count-update', handleTrophyCountUpdate);
    
    return () => {
      window.removeEventListener('trophy-count-update', handleTrophyCountUpdate);
    };
  }, []);

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
            <div className="animate-pulse">Loading posts...</div>
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

        {/* All posts */}
        {!isLoading && rawPosts.length > 0 && (
          <div className="space-y-6">
            {rawPosts.map((post) => (
              <PostItem key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* If no results found */}
        {!isLoading && rawPosts.length === 0 && !error && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-white/60">No posts found</p>
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
