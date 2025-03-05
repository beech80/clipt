import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostItem from "@/components/PostItem";
import { Post } from "@/types/post";
import { useNavigate } from "react-router-dom";
import MainNav from "@/components/MainNav";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  id: string;
  avatar_url: string;
  username: string;
  can_clip: boolean;
}

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { data: posts, isLoading, error } = useQuery<Post[]>({
    queryKey: ['posts', 'home'],
    queryFn: async () => {
      console.log("Fetching home feed...");
      let query = supabase
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
        .eq('is_private', false)
        .order('created_at', { ascending: false })
        .limit(20);

      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching posts:", error);
        throw error;
      }
      
      console.log("Fetched posts:", data);
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    // Track page view
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: 'Home',
        page_location: window.location.href,
      });
    }
  }, []);

  if (error) {
    console.error("Failed to fetch posts:", error);
    return <div>Failed to load posts...</div>;
  }

  return (
    <div className="pb-4 max-w-3xl mx-auto">
      <MainNav currentPage="home" />
      
      {/* Feed content */}
      <div className="mt-2 space-y-4 px-3 md:px-0">
        {/* Games you might like */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 px-1">Squads for You</h3>
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
            <div 
              className="flex-shrink-0 w-36 h-48 rounded-lg bg-game-card flex flex-col items-center justify-end p-3 cursor-pointer" 
              onClick={() => navigate('/game/valorant')}
            >
              <img 
                src="/games/valorant.jpg" 
                alt="Valorant" 
                className="w-full h-full object-cover rounded-lg absolute top-0 left-0" 
                style={{ opacity: 0.7 }}
              />
              <div className="relative z-10 text-center">
                <div className="text-lg font-bold">Valorant</div>
                <div className="text-xs text-gray-300">2.4k members</div>
              </div>
            </div>
            
            <div 
              className="flex-shrink-0 w-36 h-48 rounded-lg bg-game-card flex flex-col items-center justify-end p-3 cursor-pointer"
              onClick={() => navigate('/game/minecraft')}
            >
              <img 
                src="/games/minecraft.jpg" 
                alt="Minecraft" 
                className="w-full h-full object-cover rounded-lg absolute top-0 left-0" 
                style={{ opacity: 0.7 }}
              />
              <div className="relative z-10 text-center">
                <div className="text-lg font-bold">Minecraft</div>
                <div className="text-xs text-gray-300">5.1k members</div>
              </div>
            </div>
            
            <div 
              className="flex-shrink-0 w-36 h-48 rounded-lg bg-game-card flex flex-col items-center justify-end p-3 cursor-pointer"
              onClick={() => navigate('/game/league')}
            >
              <img 
                src="/games/league.jpg" 
                alt="League of Legends" 
                className="w-full h-full object-cover rounded-lg absolute top-0 left-0" 
                style={{ opacity: 0.7 }}
              />
              <div className="relative z-10 text-center">
                <div className="text-lg font-bold">League</div>
                <div className="text-xs text-gray-300">3.7k members</div>
              </div>
            </div>
            
            <div 
              className="flex-shrink-0 w-36 h-48 rounded-lg bg-game-card flex flex-col items-center justify-end p-3 cursor-pointer"
              onClick={() => navigate('/game/fortnite')}
            >
              <img 
                src="/games/fortnite.jpg" 
                alt="Fortnite" 
                className="w-full h-full object-cover rounded-lg absolute top-0 left-0" 
                style={{ opacity: 0.7 }}
              />
              <div className="relative z-10 text-center">
                <div className="text-lg font-bold">Fortnite</div>
                <div className="text-xs text-gray-300">4.2k members</div>
              </div>
            </div>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold mb-2 px-1">
          Squads Clipts
        </h3>
        
        {isLoading ? (
          // Loading skeletons for posts
          Array.from({ length: 5 }).map((_, i) => (
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
              <Skeleton className="h-60 w-full rounded-lg" />
            </div>
          ))
        ) : (
          <>
            {posts && posts.length > 0 ? (
              posts.map((post) => (
                <PostItem key={post.id} post={post} showActions={true} />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-lg">No posts found.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Follow some users or create your own post!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
