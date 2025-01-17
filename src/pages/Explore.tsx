import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp } from "lucide-react";
import { Loader2 } from "lucide-react";

const ExplorePage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: trendingHashtags, isLoading: trendingLoading } = useQuery({
    queryKey: ['trending-hashtags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_hashtags')
        .select('hashtag_id, hashtags(name)')
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['hashtag-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm) return [];
      
      const { data, error } = await supabase
        .from('hashtags')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Explore Hashtags</h1>
      
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search hashtags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {searchTerm ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Search Results</h2>
          {searchLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              {searchResults?.map((hashtag) => (
                <div
                  key={hashtag.id}
                  className="p-4 rounded-lg border border-border hover:border-primary transition-colors"
                >
                  <p className="font-medium">#{hashtag.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Trending Hashtags</h2>
          </div>
          {trendingLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              {trendingHashtags?.map((item) => (
                <div
                  key={item.hashtag_id}
                  className="p-4 rounded-lg border border-border hover:border-primary transition-colors"
                >
                  <p className="font-medium">#{item.hashtags?.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExplorePage;