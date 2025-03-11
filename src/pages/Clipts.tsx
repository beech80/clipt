import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw } from "lucide-react";
import { supabase } from "@/lib/supabase";
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

  // Function to fetch posts directly without React Query
  const fetchPostsDirectly = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Directly fetching all posts...');
      
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('is_published', true) // Check is_published instead of is_visible
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching posts directly:', error);
        setError(error.message);
        return;
      }
      
      console.log('Raw posts data:', data);
      setRawPosts(data || []);
    } catch (err) {
      console.error('Exception fetching posts:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function to manually refresh posts
  const refreshPosts = useCallback(() => {
    console.log("Manually refreshing posts...");
    setRefreshKey(prev => prev + 1);
    queryClient.invalidateQueries({ queryKey: ['posts', 'clipts'] });
    fetchPostsDirectly();
  }, [queryClient, fetchPostsDirectly]);

  // Auto-refresh effect on mount
  useEffect(() => {
    console.log("Clipts page mounted - fetching posts directly");
    fetchPostsDirectly();
  }, [fetchPostsDirectly]);

  // Regular React Query for posts - keep this for comparison
  const { data: posts, isLoading: isPostsLoading } = useQuery({
    queryKey: ['posts', 'clipts', refreshKey],
    queryFn: async () => {
      try {
        console.log('Fetching all posts for Clipts page...');
        
        // Fetch ALL posts, without any filtering, to diagnose why posts aren't showing
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
            games (
              name,
              id
            ),
            profiles (
              username,
              display_name,
              avatar_url
            ),
            likes: likes_count(count),
            comments: comments_count(count),
            clip_votes: clip_votes(count)
          `)
          // Remove all filters to show everything for debugging
          .eq('is_published', true) // Check is_published instead of is_visible
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching clips:', error);
          throw error;
        }
        
        console.log('Video posts returned:', data?.length, 'Items found');
        
        // Transform data to make sure count properties are numbers, not objects
        const transformedPosts = (data || []).map(post => {
          console.log("Processing post:", post.id, "Type:", post.post_type, "Has video:", !!post.video_url);
          return {
            ...post,
            likes: typeof post.likes === 'object' && post.likes !== null ? Number((post.likes as any).count || 0) : 0,
            comments: typeof post.comments === 'object' && post.comments !== null ? Number((post.comments as any).count || 0) : 0,
            clip_votes: typeof post.clip_votes === 'object' && post.clip_votes !== null ? Number((post.clip_votes as any).count || 0) : 0
          };
        });
        console.log("Total posts to display:", transformedPosts.length);
        return transformedPosts as unknown as Post[];
      } catch (error) {
        console.error('Error fetching clips:', error);
        return [] as Post[];
      }
    },
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 0, // Consider the data always stale so we fetch on every page visit
  });

  return (
    <div className="min-h-screen bg-[#1a237e]">
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black/40 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-center max-w-7xl mx-auto relative">
          <BackButton />
          <h1 className="text-3xl font-bold text-white">
            Clipts
          </h1>
          <button 
            onClick={refreshPosts}
            className="absolute right-0 p-2 text-white/80 hover:text-white rounded-full transition-all"
            aria-label="Refresh posts"
          >
            <RefreshCcw size={20} />
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-24 max-w-2xl">
        {(isLoading || isPostsLoading) && (
          <div className="flex justify-center my-8">
            <div className="animate-pulse">Loading posts...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-white p-4 rounded-lg mb-6">
            <h3 className="font-bold">Error loading posts:</h3>
            <p>{error}</p>
          </div>
        )}

        {/* Simple Debug View of All Posts */}
        <div className="bg-black/50 border border-purple-500/30 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Raw Posts from Database ({rawPosts.length})</h2>
          
          {rawPosts.length === 0 ? (
            <p className="text-white/70">No posts found in the database</p>
          ) : (
            <div className="space-y-4">
              {rawPosts.map((post) => (
                <div key={post.id} className="bg-black/30 p-3 rounded border border-white/10">
                  <p className="text-sm text-white/70">ID: {post.id}</p>
                  <p className="text-sm text-white/70">Type: <span className={post.post_type === 'clip' ? 'text-green-500' : 'text-yellow-500'}>{post.post_type || 'undefined'}</span></p>
                  <p className="text-sm text-white/70">Has Video: {post.video_url ? 'Yes ✓' : 'No ✗'}</p>
                  <p className="text-sm text-white/70 truncate">Content: {post.content}</p>
                  <p className="text-sm text-white/70">Created: {new Date(post.created_at).toLocaleString()}</p>
                  <p className="text-sm text-white/70">User ID: {post.user_id}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Regular Posts Display */}
        <h2 className="text-xl font-bold text-white mb-4">Posts from React Query ({posts?.length || 0})</h2>
        {posts && posts.length > 0 && (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostItem key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* If no results found */}
        {!isLoading && !isPostsLoading && (!posts || posts.length === 0) && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <p className="text-2xl font-semibold text-white/60">Ready to share a gaming moment?</p>
              <p className="text-purple-400">Click the button below to create your first clip!</p>
              <p className="text-sm text-white/60 mt-2">For video clips only!</p>
              <Button
                onClick={refreshPosts}
                className="mt-4 bg-purple-500 hover:bg-purple-600"
              >
                Refresh Posts
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Clipts;
