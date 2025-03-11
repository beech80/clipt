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
          .select('*', { count: 'exact', head: true})
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
      console.log('🔍 Directly fetching ALL posts with minimum filtering...');
      
      // Super simple query with minimal filtering to get ANY posts
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (*)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(20); // Limit to latest 20 posts for performance
        
      if (error) {
        console.error('❌ Error fetching posts directly:', error);
        setError(error.message);
        setIsLoading(false);
        return;
      }
      
      console.log(`📊 Raw query returned ${data?.length || 0} total posts:`, data);
      
      if (!data || data.length === 0) {
        console.log('❌ No posts returned from database query!');
        setError('No posts found in database.');
        setIsLoading(false);
        return;
      }
      
      // Process ALL posts with minimal transformation to see what we're getting
      const processedPosts = data.map(post => ({
        ...post,
        likes: { count: 0 },
        comments: { count: 0 },
        clip_votes: { count: 0 },
        trophy_count: 0
      }));
      
      console.log('✅ All processed posts:', processedPosts);
      
      // Set posts without any filtering at all
      setRawPosts(processedPosts);
      setIsLoading(false);
    } catch (err) {
      console.error('❌ Exception fetching posts:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
    }
  }, []);

  // Function to manually refresh posts
  const refreshPosts = useCallback(() => {
    console.log("🔄 Manually refreshing posts...");
    setRefreshKey(prev => prev + 1);
    fetchPostsDirectly();
  }, [fetchPostsDirectly]);

  // Auto-refresh posts on load - ONLY keep this useEffect
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
    
    // SINGLE interval - poll for updates every 15 seconds instead of multiple conflicting intervals
    const updateInterval = setInterval(() => {
      console.log('⏰ Periodic update interval triggered');
      fetchPostsDirectly();
    }, 15000);
    
    return () => {
      window.removeEventListener('trophy-count-update', handleTrophyCountUpdate);
      clearInterval(updateInterval);
    };
  }, [fetchPostsDirectly, refreshKey, rawPosts]);

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
        {/* Debug info section */}
        <div className="mb-4 p-2 bg-yellow-500/20 text-yellow-200 text-xs rounded">
          <div>Debug: Loading state = {isLoading ? 'TRUE' : 'FALSE'}</div>
          <div>Debug: Error = {error || 'NONE'}</div>
          <div>Debug: Posts count = {rawPosts.length}</div>
        </div>

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

        {/* Display all posts - removed video filtering */}
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
              <p className="text-2xl font-semibold text-white/60">No posts found</p>
              <p className="text-white/40">Check your database connection or create new posts!</p>
              <div className="mt-4 p-2 bg-gray-800 rounded text-xs text-left">
                <pre className="whitespace-pre-wrap">Error: {error || 'No specific error'}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Clipts;
