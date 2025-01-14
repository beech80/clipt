import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostItem from "@/components/PostItem";
import { ScrollArea } from "@/components/ui/scroll-area";

const TopClips = () => {
  const { data: topPosts } = useQuery({
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
          clip_votes:clip_votes (
            count
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Top Clips</h1>
      <ScrollArea className="h-[calc(100vh-200px)] w-full">
        {topPosts?.map((post) => (
          <PostItem key={post.id} post={post} />
        ))}
      </ScrollArea>
    </div>
  );
};

export default TopClips;