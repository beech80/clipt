import React from 'react';
import { useNavigate } from "react-router-dom";
import { BackButton } from "@/components/ui/back-button";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import PostItem from '@/components/PostItem';
import { Post } from '@/types/post';

const Clipts = () => {
  const navigate = useNavigate();

  const { data: posts } = useQuery({
    queryKey: ['posts', 'clipts'],
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
        .eq('post_type', 'clipts')
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
    <div className="min-h-screen bg-[#1a237e]">
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black/40 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-center max-w-7xl mx-auto relative">
          <BackButton />
          <h1 className="text-3xl font-bold text-white">
            Clipts
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-24 max-w-2xl">
        {posts?.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <p className="text-2xl font-semibold text-white/60">Ready to share a gaming moment?</p>
              <p className="text-purple-400">Click the button below to create your first clip!</p>
              <p className="text-sm text-white/60 mt-2">Now supporting both videos and images!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {posts?.map((post) => (
              <PostItem key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Clipts;
