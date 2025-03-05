import React from 'react';
import { useNavigate } from "react-router-dom";
import { BackButton } from "@/components/ui/back-button";
import { Camera } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import PostItem from '@/components/PostItem';
import { Skeleton } from '@/components/ui/skeleton';

const Clipts = () => {
  const navigate = useNavigate();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['clips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url,
            display_name
          )
        `)
        .eq('post_type', 'clip')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching clips:", error);
        throw error;
      }
      
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <div className="min-h-screen pb-24 bg-[#3d388b]">
      <div className="flex items-center p-4 border-b border-gaming-400/20">
        <BackButton onClick={() => navigate(-1)} />
        <h1 className="text-xl font-bold flex-1 text-center pr-8 text-white">
          Clipts
        </h1>
      </div>

      <div className="px-4 py-6 space-y-6">
        {isLoading ? (
          // Loading skeletons
          [...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl bg-card p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-[30%]" />
                  <Skeleton className="h-3 w-[20%]" />
                </div>
              </div>
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[40%]" />
              <Skeleton className="h-52 w-full rounded-lg" />
            </div>
          ))
        ) : posts && posts.length > 0 ? (
          posts.map((post) => (
            <PostItem key={post.id} post={post} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center pt-12">
            <div className="text-center space-y-4">
              <p className="text-2xl font-semibold text-white/60">Ready to share a gaming moment?</p>
              <p className="text-purple-400">Click the button below to create your first clip!</p>
              <p className="text-sm text-white/60 mt-2">Now supporting both videos and images!</p>
            </div>
          </div>
        )}
      </div>

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

export default Clipts;
