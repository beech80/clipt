import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostItem from "./PostItem";
import { ScrollArea } from "@/components/ui/scroll-area";

const PostList = () => {
  const { data: posts, refetch: refetchPosts } = useQuery({
    queryKey: ['posts'],
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  return (
    <ScrollArea className="h-[calc(100vh-200px)] w-full">
      {posts?.map((post) => (
        <PostItem 
          key={post.id} 
          post={{
            ...post,
            likes_count: post.likes?.[0]?.count || 0,
            clip_votes: post.clip_votes || []
          }} 
        />
      ))}
    </ScrollArea>
  );
};

export default PostList;