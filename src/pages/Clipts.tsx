import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import PostItem from "@/components/PostItem";
import { Post } from "@/types/post";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";

const Clipts = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [refreshKey, setRefreshKey] = useState(0);
  const [rawPosts, setRawPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const processedPosts = data
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
          likes: { count: 0 },
          comments: { count: 0 },
          clip_votes: { count: 0 }
        }));
      
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
              <PostItem key={post.id} post={post as Post} />
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
