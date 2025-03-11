import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import PostItem from "@/components/PostItem";
import { Post } from "@/types/post";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";

interface Post {
  id: string;
  content?: string;
  image_url?: string;
  video_url?: string;
  user_id: string;
  created_at: string;
  post_type?: string;
  is_published?: boolean;
  profiles?: {
    id: string;
    username?: string;
    avatar_url?: string;
    display_name?: string;
  };
  games?: {
    id: string;
    name?: string;
  };
  likes: { count: number; data?: any[] };
  comments: { count: number; data?: any[] };
  clip_votes: { count: number; data?: any[] };
  trophy_count?: number;
}

const Clipts = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [refreshKey, setRefreshKey] = useState(0);
  const [rawPosts, setRawPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to get trophy counts as a separate operation for maximum reliability
  const refreshTrophyCounts = async (postIds: string[]) => {
    console.log('🏆 Refreshing trophy counts for', postIds.length, 'posts');
    
    if (!postIds.length) return {};
    
    try {
      // Get trophy counts one by one for maximum reliability
      const trophyCountPromises = postIds.map(async (postId) => {
        // Force no caching with a timestamp parameter
        const timestamp = new Date().getTime();
        const { count, error } = await supabase
          .from('clip_votes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId)
          .eq('value', 1);
          
        if (error) {
          console.error(`Error getting trophy count for post ${postId}:`, error);
          return { postId, count: 0 };
        }
        
        console.log(`Post ${postId} has ${count} trophies`);
        return { postId, count: count || 0 };
      });
      
      const trophyCounts = await Promise.all(trophyCountPromises);
      
      // Create a map of post_id to count
      const trophyCountMap = trophyCounts.reduce((acc, item) => {
        acc[item.postId] = item.count;
        return acc;
      }, {});
      
      console.log('Trophy count map:', trophyCountMap);
      return trophyCountMap;
    } catch (error) {
      console.error('Error refreshing trophy counts:', error);
      return {};
    }
  };

  // Direct fetch function that bypasses any caching or filtering issues
  const fetchPostsDirectly = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔍 Directly fetching all video posts...');
      
      // First fetch all posts with minimal filtering to see what's in the database
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          image_url,
          video_url,
          user_id,
          post_type,
          is_published,
          created_at,
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
        .not('video_url', 'is', null) // Only get posts with videos
        .eq('is_published', true)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('❌ Error fetching posts directly:', error);
        setError(error.message);
        return;
      }
      
      // Process the posts to match the expected format for PostItem
      let processedPosts = data
        .filter(post => post.video_url) // Double-check to ensure only video posts
        .map(post => ({
          id: post.id,
          content: post.content,
          image_url: post.image_url,
          video_url: post.video_url,
          user_id: post.user_id,
          created_at: post.created_at,
          post_type: post.post_type,
          profiles: post.profiles,
          games: post.games,
          likes: { count: 0 },
          comments: { count: 0 },
          clip_votes: { count: 0 }
        }));
      
      // Get trophy counts for all posts in a single batch
      const postIds = processedPosts.map(post => post.id);
      
      // Get initial trophy counts
      if (postIds.length > 0) {
        const trophyCountMap = await refreshTrophyCounts(postIds);
        
        // Update the processed posts with the trophy counts
        processedPosts = processedPosts.map(post => {
          const trophyCount = trophyCountMap[post.id] || 0;
          
          return {
            ...post,
            clip_votes: { 
              count: trophyCount,
              data: [] // Add empty array to match structure expected by components
            },
            trophy_count: trophyCount
          };
        });
        
        console.log('Updated posts with trophy counts:', processedPosts.map(p => ({ id: p.id, count: p.trophy_count })));
      }
      
      console.log('✅ Raw posts data:', processedPosts);
      setRawPosts(processedPosts || []);
    } catch (err) {
      console.error('❌ Exception fetching posts:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function to manually refresh posts
  const refreshPosts = useCallback(() => {
    console.log("🔄 Manually refreshing posts...");
    setRefreshKey(prev => prev + 1);
    fetchPostsDirectly();
  }, [fetchPostsDirectly]);

  // Auto-refresh posts on load
  useEffect(() => {
    console.log("🚀 Clipts page mounted - fetching posts directly");
    fetchPostsDirectly();
    
    // Listen for trophy count updates from GameBoyControls or PostItem 
    const handleTrophyCountUpdate = () => {
      console.log('🔄 Trophy count update detected - refreshing posts data');
      
      // Get current posts and update trophy counts only
      if (rawPosts.length > 0) {
        const postIds = rawPosts.map(post => post.id);
        
        (async () => {
          // Get fresh trophy counts
          const trophyCountMap = await refreshTrophyCounts(postIds);
          
          // Update existing posts with new trophy counts
          const updatedPosts = rawPosts.map(post => {
            const trophyCount = trophyCountMap[post.id] || 0;
            
            return {
              ...post,
              clip_votes: { 
                count: trophyCount,
                data: [] 
              },
              trophy_count: trophyCount
            };
          });
          
          console.log('🔄 Updated trophy counts:', updatedPosts.map(p => ({ id: p.id, count: p.trophy_count })));
          setRawPosts(updatedPosts);
        })();
      } else {
        // If no posts yet, do a full refresh
        fetchPostsDirectly();
      }
    };
    
    window.addEventListener('trophy-count-update', handleTrophyCountUpdate);
    
    // Also set up manual polling for trophy count updates
    const trophyUpdateInterval = setInterval(() => {
      if (rawPosts.length > 0) {
        console.log('⏰ Polling for trophy count updates');
        handleTrophyCountUpdate();
      }
    }, 10000); // Check every 10 seconds
    
    return () => {
      window.removeEventListener('trophy-count-update', handleTrophyCountUpdate);
      clearInterval(trophyUpdateInterval);
    };
  }, [fetchPostsDirectly, refreshKey, rawPosts]);

  useEffect(() => {
    // Set up an interval to refresh posts every 5 seconds
    const refreshInterval = setInterval(() => {
      console.log("⏰ Auto-refreshing posts");
      fetchPostsDirectly();
    }, 5000);
    
    return () => clearInterval(refreshInterval);
  }, [fetchPostsDirectly]);

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
            <h3 className="font-bold">Error loading videos:</h3>
            <p>{error}</p>
          </div>
        )}

        {/* Display all video posts */}
        {!isLoading && rawPosts.length > 0 && (
          <div className="space-y-6">
            {rawPosts.map((post) => (
              <PostItem key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* If no results found */}
        {!isLoading && rawPosts.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <p className="text-2xl font-semibold text-white/60">Ready to share a video clip?</p>
              <p className="text-white/40">No video clips found. Create a new one!</p>
              <p className="text-white/40 text-sm">Only video posts will appear here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Clipts;
