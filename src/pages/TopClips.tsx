import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostItem from "@/components/PostItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

const TopClips = () => {
  const { data: topPosts, isLoading } = useQuery({
    queryKey: ['top-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          ),
          likes:likes (
            count
          ),
          clip_votes:clip_votes (
            count
          )
        `)
        .order('clip_votes(count)', { ascending: false, nullsFirst: false })
        .limit(10);

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gaming-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 gaming-gradient">Top 10 Clips</h1>
      <ScrollArea className="h-[calc(100vh-200px)] w-full">
        {topPosts?.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-lg text-muted-foreground">No clips have been voted on yet.</p>
            <p className="text-sm text-muted-foreground">Be the first to vote on your favorite clips!</p>
          </div>
        ) : (
          topPosts?.map((post) => (
            <PostItem 
              key={post.id} 
              post={{
                ...post,
                likes_count: post.likes?.[0]?.count || 0,
                clip_votes: post.clip_votes || []
              }} 
            />
          ))
        )}
      </ScrollArea>
    </div>
  );
};

export default TopClips;