import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostItem from "@/components/PostItem";
import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/components/ui/back-button";
import { Gamepad2, Heart } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";
import GameBoyControls from "@/components/GameBoyControls";

export default function GameClips() {
  const { id } = useParams();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [currentClipIndex, setCurrentClipIndex] = React.useState(0);

  const { data: game } = useQuery({
    queryKey: ['game', id],
    queryFn: async () => {
      console.log("Fetching game data for ID:", id);
      const { data, error } = await supabase.functions.invoke('igdb', {
        body: {
          endpoint: 'games',
          query: `fields name,cover.url,summary; where id = ${id};`
        }
      });
      if (error) throw error;
      return data[0];
    }
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ['game-posts', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (username, avatar_url),
          games:game_id (name)
        `)
        .eq('game_id', id)
        .eq('type', 'video')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!id
  });

  if (isLoading) {
    return <Skeleton className="h-screen" />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gaming-900">
      <div className="fixed top-0 left-0 right-0 h-16 bg-gaming-800/95 backdrop-blur-sm z-50 
                    border-b border-gaming-400/20 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-xl font-bold text-gaming-100">{game?.name} Clips</h1>
        </div>
      </div>

      <div className={`relative ${isMobile ? 'h-[calc(100vh-120px)]' : 'h-[calc(100vh-200px)]'} 
                    mt-16 overflow-y-auto snap-y snap-mandatory scroll-smooth touch-none overscroll-none post-container`}>
        {posts?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-gaming-800/50">
            <Gamepad2 className="w-16 h-16 text-gaming-400 mb-4" />
            <p className="text-gaming-200 text-lg font-medium">
              No clips found for {game?.name}
            </p>
            <p className="text-gaming-400 mt-2">
              Be the first to share an epic gaming moment!
            </p>
          </div>
        ) : (
          <div className="space-y-4 pb-20">
            {posts?.map((post) => (
              <div key={post.id} className="snap-start">
                <PostItem post={post} />
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Game controls with rainbow borders and joystick */}
      <GameBoyControls />
    </div>
  );
}
