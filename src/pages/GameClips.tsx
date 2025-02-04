import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostItem from "@/components/PostItem";
import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/components/ui/back-button";
import { Gamepad2 } from "lucide-react";
import GameBoyControls from "@/components/GameBoyControls";
import { useIsMobile } from "@/hooks/use-mobile";

export default function GameClips() {
  const { id } = useParams();
  const isMobile = useIsMobile();
  console.log("GameClips page - Game ID:", id);

  const { data: game, isLoading: isLoadingGame } = useQuery({
    queryKey: ['game', id],
    queryFn: async () => {
      console.log("Fetching game data for ID:", id);
      const { data, error } = await supabase.functions.invoke('igdb', {
        body: {
          endpoint: 'games',
          query: `fields name,cover.url,summary; where id = ${id};`
        }
      });
      if (error) {
        console.error("Error fetching game:", error);
        throw error;
      }
      console.log("Game data received:", data);
      return data[0];
    }
  });

  const { data: posts, isLoading: isLoadingPosts } = useQuery({
    queryKey: ['game-posts', id],
    queryFn: async () => {
      console.log("Fetching posts for game ID:", id);
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (username, avatar_url),
          likes (count),
          clip_votes (count),
          post_game_categories!inner (
            game_categories (
              name
            )
          )
        `)
        .eq('post_game_categories.game_categories.slug', id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      console.log("Posts data received:", data);
      return data;
    },
    enabled: !!id
  });

  if (isLoadingGame) {
    return <Skeleton className="h-screen" />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gaming-900">
      {/* Fixed header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-gaming-800/95 backdrop-blur-sm z-50 
                    border-b border-gaming-400/20 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-xl font-bold text-gaming-100">{game?.name}</h1>
        </div>
      </div>

      {/* Scrollable content container */}
      <div className={`relative ${isMobile ? 'h-[calc(100vh-120px)]' : 'h-[calc(100vh-200px)]'} 
                    mt-16 overflow-y-auto snap-y snap-mandatory scroll-smooth touch-none overscroll-none post-container`}>
        {isLoadingPosts ? (
          <div className="space-y-4 p-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-4 pb-20">
            {posts.map((post) => (
              <div key={post.id} className="snap-start">
                <PostItem post={post} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-gaming-800/50">
            <Gamepad2 className="w-16 h-16 text-gaming-400 mb-4" />
            <p className="text-gaming-200 text-lg font-medium">
              No clips found for {game?.name}
            </p>
            <p className="text-gaming-400 mt-2">
              Be the first to share an epic gaming moment!
            </p>
          </div>
        )}
      </div>

      {/* GameBoy Controls */}
      <GameBoyControls />
    </div>
  );
}