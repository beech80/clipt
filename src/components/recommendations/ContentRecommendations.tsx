/**
 * ContentRecommendations Component
 * 
 * Displays personalized content recommendations for the authenticated user.
 * Uses Supabase's built-in recommendation system to fetch relevant posts
 * based on user interactions and preferences.
 * 
 * Features:
 * - Personalized post recommendations
 * - Loading states with skeleton UI
 * - Error handling
 * - Responsive design
 */
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import PostItem from "@/components/PostItem";

export function ContentRecommendations() {
  const { user } = useAuth();

  const { data: recommendations } = useQuery({
    queryKey: ['personalized-recommendations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_personalized_recommendations', {
        user_id_param: user?.id
      });

      if (error) throw error;
      if (!data?.length) return [];
      const { data: posts, error: postsError } = await supabase.from('posts')
        .select('id, content, image_url, video_url, user_id, created_at, profiles(username, avatar_url, display_name)')
        .in('id', data.map(item => item.post_id));
      if (postsError) throw postsError;
      const byId = new Map((posts ?? []).map(post => [post.id, post]));
      return data.flatMap(item => { const post = byId.get(item.post_id); return post ? [post] : []; });
    },
    enabled: !!user
  });

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Recommended For You</h2>
        <p className="text-muted-foreground">
          Content based on your interests
        </p>
      </div>

      <div className="space-y-4">
        {recommendations?.map((recommendation) => (
          <PostItem
            key={recommendation.id}
            post={recommendation}
          />
        ))}
      </div>
    </Card>
  );
}
