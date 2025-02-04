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

  // Subscribe to post updates
  useEffect(() => {
    const channel = supabase
      .channel('public:post_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          console.log('Post updated:', payload);
          setPosts((currentPosts) =>
            currentPosts.map((post) =>
              post.id === payload.new.id ? { ...post, ...payload.new } : post
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) {
    return <div>Loading posts...</div>;
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostItem key={post.id} post={post} />
      ))}
    </div>
  );
};

export default PostList;