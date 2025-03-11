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
      
      // Query for ALL posts without any video filtering
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
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) {
        console.error('Error fetching posts:', error);
        setError(error.message);
        setIsLoading(false);
        return;
      }
      
      if (!data || data.length === 0) {
        // If no posts found, create dummy posts with working videos for testing
        const dummyPosts: ExtendedPost[] = [
          {
            id: "dummy1",
            content: "Sample video post 1",
            image_url: null,
            video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
            user_id: "system",
            created_at: new Date().toISOString(),
            profiles: {
              username: "system",
              display_name: "System",
              avatar_url: null
            },
            is_published: true,
            clip_votes: [{ count: 0 }],
            trophy_count: 0
          },
          {
            id: "dummy2",
            content: "Sample video post 2",
            image_url: null,
            video_url: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4",
            user_id: "system",
            created_at: new Date().toISOString(),
            profiles: {
              username: "system",
              display_name: "System",
              avatar_url: null
            },
            is_published: true,
            clip_votes: [{ count: 0 }],
            trophy_count: 0
          }
        ];
        
        setRawPosts(dummyPosts);
        setIsLoading(false);
        return;
      }
      
      // Process ALL posts without filtering for videos
      const processedPosts = data.map(post => {
        const formattedPost: ExtendedPost = {
          id: post.id,
          content: post.content || "", 
          image_url: post.image_url,
          video_url: post.video_url,
          user_id: post.user_id,
          created_at: post.created_at,
          profiles: post.profiles,
          games: post.games,
          clip_votes: [{ count: 0 }],
          is_published: post.is_published,
          trophy_count: 0
        };
          
        return formattedPost;
      });

      // Add sample videos to ensure we have something to display
      const sampleVideoPosts: ExtendedPost[] = [
        {
          id: "sample1",
          content: "Sample video post from MDN",
          image_url: null,
          video_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
          user_id: "system",
          created_at: new Date().toISOString(),
          profiles: {
            username: "system",
            display_name: "Sample",
            avatar_url: null
          },
          is_published: true,
          clip_votes: [{ count: 0 }],
          trophy_count: 0
        }
      ];
      
      // Combine actual posts with sample posts
      setRawPosts([...sampleVideoPosts, ...processedPosts]);
      setIsLoading(false);
    } catch (err) {
      console.error('Exception fetching posts:', err);
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
            <div className="animate-pulse">Loading content...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-white p-4 rounded-lg mb-6">
            <h3 className="font-bold">Error:</h3>
            <p>{error}</p>
          </div>
        )}

        {/* Sample embedded video to verify player works */}
        <div className="mb-8 pb-4 border-b border-gray-800">
          <h2 className="text-lg font-bold mb-2 text-white">Sample Video</h2>
          <video 
            src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm"
            controls
            className="w-full aspect-video rounded"
            poster="https://interactive-examples.mdn.mozilla.net/media/examples/flower.jpg"
          ></video>
        </div>

        {/* All posts */}
        {!isLoading && rawPosts.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold mb-2 text-white">All Posts</h2>
            {rawPosts.map((post) => (
              <div key={post.id} className="border border-gray-800 rounded overflow-hidden">
                <div className="p-2 bg-gray-900">
                  <p className="text-xs text-gray-400">
                    {post.video_url ? '🎬 Has video' : '📷 No video'}
                  </p>
                </div>
                <PostItem key={post.id} post={post} />
              </div>
            ))}
          </div>
        )}

        {/* If no results found */}
        {!isLoading && rawPosts.length === 0 && !error && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-white/60">No content found</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Clipts;
