import React from 'react';
import { useNavigate } from "react-router-dom";
import { BackButton } from "@/components/ui/back-button";
import { Camera } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import PostItem from '@/components/PostItem';
import { Post } from '@/types/post';

const Clipts = () => {
  const navigate = useNavigate();
  const [debugPosts, setDebugPosts] = React.useState<any[]>([]);
  const [showAllPosts, setShowAllPosts] = React.useState(false);

  // Debug function to directly query the database
  const fetchAllPosts = async () => {
    try {
      console.log('DEBUG: Fetching ALL posts...');
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          image_url,
          video_url,
          user_id,
          created_at,
          post_type
        `)
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) {
        console.error('Error fetching all posts:', error);
        return;
      }
      
      console.log('DEBUG: All posts returned:', data?.length, 'Items found');
      console.log('DEBUG: Post types:', data?.map(p => p.post_type));
      console.log('DEBUG: Video URLs:', data?.filter(p => p.video_url).length);
      
      setDebugPosts(data || []);
    } catch (error) {
      console.error('Error in debug fetch:', error);
    }
  };

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts', 'clipts'],
    queryFn: async () => {
      try {
        console.log('Fetching clips...');
        
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
          .eq('post_type', 'clip')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching clips:', error);
          throw error;
        }
        
        console.log('Clips returned:', data?.length, 'Items found');
        console.log('Clip data sample:', data?.[0]);
        
        // Transform data to make sure count properties are numbers, not objects
        return (data || []).map(post => ({
          ...post,
          likes: typeof post.likes === 'object' && post.likes !== null ? Number(post.likes.count || 0) : 0,
          comments: typeof post.comments === 'object' && post.comments !== null ? Number(post.comments.count || 0) : 0,
          clip_votes: typeof post.clip_votes === 'object' && post.clip_votes !== null ? Number(post.clip_votes.count || 0) : 0
        })) as Post[];
      } catch (error) {
        console.error('Error fetching clips:', error);
        return [] as Post[];
      }
    },
    refetchInterval: 10000, // Increase refetch interval for testing
  });

  // Run debug fetch on component mount
  React.useEffect(() => {
    fetchAllPosts();
  }, []);

  return (
    <div className="min-h-screen bg-[#1a237e]">
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black/40 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-center max-w-7xl mx-auto relative">
          <BackButton />
          <h1 className="text-3xl font-bold text-white">
            Clipts
          </h1>
          <button 
            onClick={() => {
              setShowAllPosts(!showAllPosts);
              fetchAllPosts();
            }}
            className="absolute right-0 text-xs bg-purple-700 px-2 py-1 rounded-md"
          >
            {showAllPosts ? "Show Clips Only" : "Debug Mode"}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-24 max-w-2xl">
        {isLoading && !showAllPosts && (
          <div className="flex justify-center my-8">
            <div className="animate-pulse">Loading posts...</div>
          </div>
        )}

        {/* Debug mode - show all posts */}
        {showAllPosts && debugPosts.length > 0 && (
          <div className="space-y-6">
            <div className="bg-black/30 p-3 rounded-lg mb-4">
              <h2 className="text-xl font-bold text-white mb-2">DEBUG: All Posts ({debugPosts.length})</h2>
              <div className="space-y-2">
                {debugPosts.map((post) => (
                  <div key={post.id} className="bg-black/20 p-2 rounded border border-white/10">
                    <p className="text-sm text-white/70">ID: {post.id}</p>
                    <p className="text-sm text-white/70">Type: <span className={post.post_type === 'clip' ? 'text-green-500' : 'text-yellow-500'}>{post.post_type}</span></p>
                    <p className="text-sm text-white/70 truncate">Content: {post.content}</p>
                    <p className="text-sm text-white/70">Has Video: {post.video_url ? 'Yes ✓' : 'No ✗'}</p>
                    <p className="text-sm text-white/70">Created: {new Date(post.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Normal clips view */}
        {!showAllPosts && posts && posts.length > 0 && (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostItem key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* If no results found */}
        {!isLoading && !showAllPosts && (!posts || posts.length === 0) && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <p className="text-2xl font-semibold text-white/60">Ready to share a gaming moment?</p>
              <p className="text-purple-400">Click the button below to create your first clip!</p>
              <p className="text-sm text-white/60 mt-2">For video clips only!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Clipts;
