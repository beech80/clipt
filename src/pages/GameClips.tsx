import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostItem from "@/components/PostItem";
import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/components/ui/back-button";
import { Gamepad2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GameClips() {
  const { id } = useParams();
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
    <div className="container mx-auto max-w-4xl py-6">
      {/* Gameboy-style container */}
      <div className="bg-gaming-800 rounded-lg shadow-xl p-6 border-4 border-gaming-600">
        {/* Header section */}
        <div className="flex items-center gap-4 mb-6">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold text-gaming-100">{game?.name} Hub</h1>
            {game?.summary && (
              <p className="text-gaming-300 mt-2">{game.summary}</p>
            )}
          </div>
        </div>

        {/* Content type selector */}
        <div className="flex gap-4 mb-6">
          <Button 
            variant="default"
            className="flex items-center gap-2 bg-gaming-700 hover:bg-gaming-600"
          >
            <Video className="w-4 h-4" />
            Clips
          </Button>
          <Button 
            variant="default"
            className="flex items-center gap-2 bg-gaming-700 hover:bg-gaming-600"
          >
            <Gamepad2 className="w-4 h-4" />
            Streams
          </Button>
        </div>

        {/* Clips grid */}
        <div className="space-y-6">
          {isLoadingPosts ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-96" />
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostItem key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gaming-700/50 rounded-lg">
              <Gamepad2 className="w-12 h-12 mx-auto text-gaming-400 mb-4" />
              <p className="text-gaming-300">
                No clips found for this game yet.
              </p>
              <p className="text-gaming-400 text-sm mt-2">
                Be the first to share a clip!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}