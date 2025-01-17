import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostItem from "@/components/PostItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import GameBoyControls from "@/components/GameBoyControls";

const Clipts = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['clipts-feed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          ),
          likes (
            count
          ),
          clip_votes (
            count
          )
        `)
        .order('created_at', { ascending: false })
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
    <div className="h-[calc(100vh-80px)]">
      <h1 className="text-2xl font-bold mb-4 text-center gaming-gradient">Clipts</h1>
      <ScrollArea className="h-full">
        <div className="snap-y snap-mandatory h-full overflow-y-scroll">
          {posts?.map((post) => (
            <div key={post.id} className="snap-start snap-always h-[calc(100vh-80px)]">
              <PostItem 
                post={{
                  ...post,
                  likes_count: post.likes?.[0]?.count || 0,
                  clip_votes: post.clip_votes || []
                }} 
              />
            </div>
          ))}
        </div>
      </ScrollArea>
      <GameBoyControls />
    </div>
  );
};

export default Clipts;