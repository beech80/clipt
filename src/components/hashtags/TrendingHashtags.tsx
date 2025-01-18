import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Hash, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface TrendingHashtag {
  hashtag_id: string;
  hashtags: {
    name: string;
  };
  count: number;
}

export function TrendingHashtags() {
  const navigate = useNavigate();
  
  const { data: trendingHashtags, isLoading } = useQuery({
    queryKey: ['trending-hashtags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_hashtags')
        .select(`
          hashtag_id,
          hashtags!inner (
            name
          ),
          count:count(*) over (partition by hashtag_id)
        `)
        .order('count', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as TrendingHashtag[];
    }
  });

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-32 bg-muted rounded mb-4"></div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-gaming-400" />
        <h2 className="text-lg font-semibold">Trending Hashtags</h2>
      </div>
      <div className="grid gap-2">
        {trendingHashtags?.map((tag) => (
          <Button
            key={tag.hashtag_id}
            variant="outline"
            className="w-full justify-start gap-2 text-left"
            onClick={() => navigate(`/hashtag/${tag.hashtags.name}`)}
          >
            <Hash className="w-4 h-4 text-gaming-400" />
            <span>#{tag.hashtags.name}</span>
            <span className="ml-auto text-muted-foreground text-sm">
              {tag.count} posts
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}