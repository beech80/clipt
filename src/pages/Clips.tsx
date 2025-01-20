import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostItem from "@/components/PostItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { BackButton } from "@/components/ui/back-button";

const Clips = () => {
  const { user } = useAuth();

  const { data: likedPosts, isLoading } = useQuery({
    queryKey: ['liked-posts'],
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
          ),
          comments:comments (
            count
          )
        `)
        .in('id', (await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user?.id))
          .data?.map(like => like.post_id) || [])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user
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
      <div className="flex items-center mb-6">
        <BackButton />
        <h1 className="text-2xl font-bold gaming-gradient">Your Liked Clips</h1>
      </div>
      <ScrollArea className="h-[calc(100vh-200px)] w-full">
        {likedPosts?.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-lg text-muted-foreground">No liked clips yet.</p>
            <p className="text-sm text-muted-foreground">Like some clips to see them here!</p>
          </div>
        ) : (
          likedPosts?.map((post) => (
            <PostItem 
              key={post.id} 
              post={{
                ...post,
                likes_count: post.likes?.[0]?.count || 0,
                clip_votes: post.clip_votes || [],
                comments_count: post.comments?.[0]?.count || 0
              }} 
            />
          ))
        )}
      </ScrollArea>
    </div>
  );
};

export default Clips;