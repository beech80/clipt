import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostItem from "@/components/PostItem";
import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/components/ui/back-button";
import { Gamepad2, FilmIcon } from "lucide-react";

export default function GamePage() {
  const { slug } = useParams();

  const { data: game, isLoading: isLoadingGame } = useQuery({
    queryKey: ['game', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_categories')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: posts, isLoading: isLoadingPosts } = useQuery({
    queryKey: ['game-posts', slug],
    queryFn: async () => {
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
        .eq('post_game_categories.game_categories.slug', slug)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug
  });

  if (isLoadingGame) {
    return <Skeleton className="h-screen" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a237e] to-[#0d1b3c]">
      {/* Game Header */}
      <div className="sticky top-0 z-50 bg-black/40 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto max-w-4xl py-3">
          <div className="flex items-center gap-4">
            <BackButton className="text-white hover:text-purple-300" />
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Gamepad2 className="text-purple-400 h-5 w-5" />
                {game?.name || "Game"}
              </h1>
              <p className="text-purple-300 text-sm mt-1 flex items-center">
                CLIPTS
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto max-w-4xl py-6 px-4 space-y-6">
        {game?.description && (
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <p className="text-gray-300">{game.description}</p>
          </div>
        )}

        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <FilmIcon className="h-5 w-5 text-purple-400" />
            Latest Clips
          </h2>
          
          {isLoadingPosts ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-96 bg-gray-800/50" />
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostItem key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center bg-black/30 backdrop-blur-sm rounded-xl p-12 border border-white/10">
              <p className="text-purple-300 font-medium text-lg mb-2">No clips found</p>
              <p className="text-gray-400">Be the first to share a clip for this game!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
