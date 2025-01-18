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
      return data;
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
        {recommendations?.map((recommendation: any) => (
          <PostItem
            key={recommendation.post_id}
            post={recommendation}
          />
        ))}
      </div>
    </Card>
  );
}