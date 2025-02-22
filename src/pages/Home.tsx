
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import GameBoyControls from '@/components/GameBoyControls';
import { useNavigate } from 'react-router-dom';
import { Camera } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import PostItem from '@/components/PostItem';
import { Post } from '@/types/post';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: posts } = useQuery({
    queryKey: ['posts', 'home'],
    queryFn: async () => {
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

      if (error) throw error;

      return data?.map(post => ({
        ...post,
        likes_count: post.likes?.[0]?.count || 0,
        clip_votes: post.clip_votes || []
      })) as Post[];
    },
  });

  return (
    <div className="relative min-h-screen bg-gaming-900">
      {/* Modern Header with Gradient and Blur */}
      <div className="w-full py-6 px-4 bg-gradient-to-b from-gaming-800/80 to-transparent backdrop-blur-sm">
        <h1 className="text-center text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Squads Clipts
        </h1>
      </div>

      {/* Posts Feed */}
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
        {posts?.map((post) => (
          <PostItem key={post.id} post={post} />
        ))}
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

      <GameBoyControls />
    </div>
  );
};

export default Home;
