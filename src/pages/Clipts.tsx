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

  // Function to manually refresh posts
  const refreshPosts = useCallback(() => {
    console.log("Manually refreshing posts...");
    setRefreshKey(prev => prev + 1);
    queryClient.invalidateQueries({ queryKey: ['posts', 'clipts'] });
  }, [queryClient]);

  // Auto-refresh effect on mount
  useEffect(() => {
    console.log("Clipts page mounted - refreshing posts");
    refreshPosts();
  }, [refreshPosts]);

  const { data: posts, isLoading } = useQuery({
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
        {isLoading && (
          <div className="flex justify-center my-8">
            <div className="animate-pulse">Loading posts...</div>
          </div>
        )}

        {posts && posts.length > 0 && (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostItem key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* If no results found */}
        {!isLoading && (!posts || posts.length === 0) && (
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
