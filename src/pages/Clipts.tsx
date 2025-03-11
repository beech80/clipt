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
      console.log('🔍 Fetching video posts...');
      
      // Query to get video posts
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
        .not('video_url', 'is', null)  // Only get posts with videos
        .neq('video_url', '')         // Make sure video URL is not empty
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (error) {
        console.error('❌ Error fetching posts:', error);
        setError(error.message);
        setIsLoading(false);
        return;
      }
      
      console.log(`📊 Query returned ${data?.length || 0} video posts`);
      
      if (!data || data.length === 0) {
        console.log('No video posts found');
        setRawPosts([]);
        setIsLoading(false);
        return;
      }
      
      // Process posts with minimal transformation to match the Post type
      const processedPosts = data.map(post => {
        // Create a properly formatted Post object
        const formattedPost: ExtendedPost = {
          id: post.id,
          content: post.content || "", // Make sure content exists
          image_url: post.image_url,
          video_url: post.video_url,
          user_id: post.user_id,
          created_at: post.created_at,
          profiles: post.profiles,
          games: post.games,
          // clip_votes needs to be an array according to the Post type
          clip_votes: [{ count: 0 }],
          // Add other optional fields
          is_published: post.is_published,
          trophy_count: 0 // Our custom property
        };
          
        return formattedPost;
      });
      
      console.log('✅ Processed video posts:', processedPosts.length);
      
      // Get trophy counts for all posts
      const postIds = processedPosts.map(post => post.id);
      
      if (postIds.length > 0) {
        try {
          const trophyCountMap = await refreshTrophyCounts(postIds);
          
          // Update trophy counts
          const updatedPosts = processedPosts.map(post => {
            const trophyCount = trophyCountMap[post.id] || 0;
            return {
              ...post,
              // Update clip_votes to have the correct count in the array format
              clip_votes: [{ count: trophyCount }],
              trophy_count: trophyCount
            };
          });
          
          setRawPosts(updatedPosts);
        } catch (countError) {
          console.error('Error updating trophy counts:', countError);
          setRawPosts(processedPosts);
        }
      } else {
        setRawPosts([]);
      }
      
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
              clip_votes: [{ count: trophyCount }],
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

        {/* Display video posts */}
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
            <div className="text-center space-y-4">
              <p className="text-2xl font-semibold text-white/60">Ready to share a video clip?</p>
              <p className="text-white/40">No video clips found. Create a new one!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Clipts;
