import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostItem from "@/components/PostItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { BackButton } from "@/components/ui/back-button";
import { motion } from "framer-motion";

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
      <div className="flex h-[50vh] items-center justify-center bg-gaming-800">
        <Loader2 className="h-8 w-8 animate-spin text-gaming-300" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gaming-800 text-white"
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center mb-8 space-x-4"
        >
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gaming-300 to-gaming-500 bg-clip-text text-transparent">
              Your Liked Clips
            </h1>
            <p className="text-gaming-300 mt-1">Your collection of favorite gaming moments</p>
          </div>
        </motion.div>
        
        <ScrollArea className="h-[calc(100vh-200px)] w-full rounded-lg border border-gaming-600/20 bg-gaming-900/40 backdrop-blur-sm">
          <div className="p-4 space-y-6">
            {likedPosts?.length === 0 ? (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-12 gaming-card"
              >
                <TrendingUp className="w-12 h-12 mx-auto text-gaming-400 mb-4" />
                <p className="text-xl text-gaming-300 font-semibold mb-2">No liked clips yet</p>
                <p className="text-gaming-400">Like some clips to see them here!</p>
              </motion.div>
            ) : (
              <div className="grid gap-6">
                {likedPosts?.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <PostItem 
                      post={{
                        ...post,
                        likes_count: post.likes?.[0]?.count || 0,
                        clip_votes: post.clip_votes || [],
                        comments_count: post.comments?.[0]?.count || 0
                      }} 
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </motion.div>
  );
};

export default Clips;