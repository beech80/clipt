
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
          games:game_id (
            name
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <div 
          key={post.id} 
          className="bg-gaming-800/80 backdrop-blur-sm rounded-lg overflow-hidden shadow-lg border border-gaming-700/50 hover:border-gaming-600/50 transition-colors"
        >
          <PostItem post={post} />
        </div>
      ))}
      {posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No posts yet. Be the first to share something!</p>
        </div>
      )}
    </div>
  );
};

export default PostList;
