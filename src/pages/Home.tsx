
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import GameBoyControls from '@/components/GameBoyControls';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import PostItem from '@/components/PostItem';
import { useNavigate } from 'react-router-dom';
import { Camera } from "lucide-react";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['home-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          ),
          games:game_id (
            name
          ),
          likes:likes(count),
          clip_votes:clip_votes(count)
        `)
        .eq('post_type', 'home')
        .is('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="relative min-h-screen bg-gaming-900">
      <div className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : posts?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts?.map((post) => (
              <div 
                key={post.id} 
                className="bg-gaming-800/80 backdrop-blur-sm rounded-lg overflow-hidden shadow-lg border border-gaming-700/50 hover:border-gaming-600/50 transition-colors"
              >
                <PostItem post={post} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed left-1/2 -translate-x-1/2 bottom-24 sm:bottom-28">
        <button 
          onClick={() => navigate('/post/new')}
          className="post-button active:scale-95 transition-transform"
          aria-label="Create Post"
          style={{ width: '80px', height: '60px' }}
        >
          <Camera className="post-button-icon" />
          <span className="post-button-text">Post</span>
        </button>
      </div>

      <GameBoyControls />
    </div>
  );
};

export default Home;
