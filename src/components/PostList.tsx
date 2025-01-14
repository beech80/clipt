import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostItem from "./PostItem";

const PostList = () => {
  const { data: posts } = useQuery({
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
    <div className="h-full">
      {posts?.map((post) => (
        <div key={post.id} className="snap-start snap-always h-[calc(100vh-200px)]">
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
  );
};

export default PostList;