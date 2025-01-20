import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostItem from "@/components/PostItem";
import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/components/ui/back-button";

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
    <div className="container mx-auto max-w-4xl py-6 space-y-6">
      <div className="flex items-center gap-4">
        <BackButton />
        <h1 className="text-2xl font-bold">{game?.name}</h1>
      </div>
      
      <p className="text-muted-foreground">{game?.description}</p>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Latest Clips</h2>
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
          <p className="text-center text-muted-foreground py-12">
            No clips found for this game yet.
          </p>
        )}
      </div>
    </div>
  );
}
