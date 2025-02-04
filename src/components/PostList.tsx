import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostItem from "./PostItem";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const PostList = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);

  const { data, isLoading } = useQuery({
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
    },
  });

  useEffect(() => {
    if (data) {
      setPosts(data);
    }
  }, [data]);

  // Subscribe to new posts
  useEffect(() => {
    const channel = supabase
      .channel('public:posts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          console.log('New post received:', payload);
          setPosts((currentPosts) => [payload.new, ...currentPosts]);
          toast.info("New post available!");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-64 bg-gaming-800/50 rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <div key={post.id} className="transform hover:-translate-y-1 transition-all duration-300">
          <PostItem post={post} />
        </div>
      ))}
    </div>
  );
};

export default PostList;