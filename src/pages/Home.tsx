import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostItem from "@/components/PostItem";
import { cn } from "@/lib/utils";
import GameCategories from "@/components/GameCategories";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Camera } from "lucide-react";
import { Post } from '@/types/post';
import { toast } from 'sonner';

// Mock data for testing purposes
const MOCK_POSTS = [
  {
    id: '1',
    title: 'Amazing play in Valorant!',
    content: 'Check out this clip where I got a pentakill with just a pistol.',
    user_id: '123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    game_id: '1',
    post_type: 'home',
    media_url: 'https://placehold.co/600x400/333/FFF?text=Gaming+Clip',
    profiles: {
      username: 'GamerPro99',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
    },
    games: {
      name: 'Valorant'
    },
    likes_count: 156,
    comments_count: 24
  },
  {
    id: '2',
    title: 'New strategy for Apex Legends',
    content: 'This new rotation strategy is game-changing for ranked play.',
    user_id: '456',
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    game_id: '2',
    post_type: 'home',
    media_url: 'https://placehold.co/600x400/333/FFF?text=Apex+Strategy',
    profiles: {
      username: 'ApexPredator',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
    },
    games: {
      name: 'Apex Legends'
    },
    likes_count: 89,
    comments_count: 17
  },
  {
    id: '3',
    title: 'Insane Minecraft build completed!',
    content: 'After 3 months, my medieval castle is finally complete. What do you think?',
    user_id: '789',
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    game_id: '3',
    post_type: 'home',
    media_url: 'https://placehold.co/600x400/333/FFF?text=Minecraft+Castle',
    profiles: {
      username: 'CreativeCrafter',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria'
    },
    games: {
      name: 'Minecraft'
    },
    likes_count: 214,
    comments_count: 45
  }
];

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['posts', 'home'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select(`
            *,
            profiles:user_id (
              username,
              avatar_url
            ),
            games:game_id (name),
            likes:likes(count),
            clip_votes:clip_votes(count)
          `)
          .eq('post_type', 'home')
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching posts:", error);
          // Fall back to mock data
          console.log("Using mock data due to error");
          return MOCK_POSTS;
        }

        if (!data || data.length === 0) {
          console.log("No posts found, using mock data");
          return MOCK_POSTS;
        }

        // Ensure each post has a properly formatted id
        const formattedPosts = data?.map(post => ({
          ...post,
          id: post.id.toString(), // Ensure ID is a string
          likes_count: post.likes?.[0]?.count || 0,
          clip_votes: post.clip_votes || []
        })) as Post[];

        console.log("Posts fetched:", formattedPosts);
        return formattedPosts.length > 0 ? formattedPosts : MOCK_POSTS;
      } catch (err) {
        console.error("Exception fetching posts:", err);
        // Fall back to mock data
        return MOCK_POSTS;
      }
    },
  });

  // Display toast if there was an error but we're showing mock data
  useEffect(() => {
    if (error) {
      toast.error("Could not connect to the server. Showing sample posts.", {
        description: "We're working on fixing this issue."
      });
    }
  }, [error]);

  return (
    <div className="relative min-h-screen bg-gaming-900">
      {/* Modern Header with Gradient and Blur */}
      <div className="w-full py-6 px-4 bg-gradient-to-b from-gaming-800/80 to-transparent backdrop-blur-sm">
        <h1 className="text-center text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Squads Clipts
        </h1>
      </div>

      <div className="container mx-auto px-4 py-6 pb-32">
        {/* Main feed */}
        <div className="space-y-6 max-w-2xl mx-auto">
          {isLoading ? (
            // Loading state with multiple skeletons
            Array(3).fill(0).map((_, index) => (
              <div key={index} className="bg-gaming-800 rounded-xl p-4 animate-pulse">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="rounded-full bg-gaming-700 h-12 w-12"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gaming-700 rounded w-1/4"></div>
                    <div className="h-3 bg-gaming-700 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-4 bg-gaming-700 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gaming-700 rounded w-1/2 mb-3"></div>
                <div className="h-52 bg-gaming-700 rounded w-full mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-8 bg-gaming-700 rounded w-1/4"></div>
                  <div className="h-8 bg-gaming-700 rounded w-1/4"></div>
                  <div className="h-8 bg-gaming-700 rounded w-1/4"></div>
                </div>
              </div>
            ))
          ) : error && !posts ? (
            <div className="text-center py-20 text-red-400">
              <p>Failed to load posts. Please try again later.</p>
            </div>
          ) : posts && posts.length > 0 ? (
            posts.map((post) => (
              <PostItem 
                key={post.id} 
                post={post} 
                data-post-id={post.id}
              />
            ))
          ) : (
            <div className="text-center py-20 text-gray-400">
              <p>No posts available. Create your first post!</p>
            </div>
          )}
        </div>
      </div>

      {/* Center Camera Button */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-24 sm:bottom-28">
        <button 
          onClick={() => navigate('/post/new')}
          className="clip-button active:scale-95 transition-transform"
          aria-label="Create Clipt"
          style={{ width: '80px', height: '60px' }}
        >
          <Camera className="clip-button-icon" />
          <span className="clip-button-text">Clipt</span>
        </button>
      </div>
    </div>
  );
};

export default Home;
