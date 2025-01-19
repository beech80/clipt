import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import PostItem from "@/components/PostItem";
import { toast } from "sonner";

const GamePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: gameData, isLoading: gameLoading } = useQuery({
    queryKey: ['game', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const { data: gamePosts, isLoading: postsLoading } = useQuery({
    queryKey: ['game-posts', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          ),
          likes (count),
          clip_votes (count),
          comments (count),
          post_game_categories!inner (
            game_categories (
              name,
              slug
            )
          )
        `)
        .eq('post_game_categories.game_categories.slug', slug)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (gameLoading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!gameData) {
    toast.error("Game not found");
    navigate("/discover");
    return null;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/discover")}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{gameData.name}</h1>
      </div>

      {gameData.description && (
        <p className="text-muted-foreground">{gameData.description}</p>
      )}

      {gameData.thumbnail_url && (
        <img
          src={gameData.thumbnail_url}
          alt={gameData.name}
          className="w-full h-48 object-cover rounded-lg"
        />
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Latest Clips</h2>
        {postsLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[400px] w-full" />
            ))}
          </div>
        ) : gamePosts && gamePosts.length > 0 ? (
          <div className="space-y-4">
            {gamePosts.map((post) => (
              <PostItem key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No clips found for this game yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default GamePage;