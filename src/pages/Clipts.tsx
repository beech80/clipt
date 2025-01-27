import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Loader2, Plus } from "lucide-react";
import GameBoyControls from "@/components/GameBoyControls";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PostContent from "@/components/post/PostContent";
import { PostInteractions } from "@/components/post/interactions/PostInteractions";

const Clipts = () => {
  const navigate = useNavigate();

  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['clipts-feed'],
    queryFn: async () => {
      console.log('Fetching clipts feed...');
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
          ),
          comments:comments(count)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching clipts:', error);
        toast.error("Failed to load clips");
        throw error;
      }

      console.log('Fetched clipts:', data);
      return data;
    }
  });

  if (error) {
    console.error('Query error:', error);
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center gaming-card p-8">
          <h3 className="text-xl font-semibold mb-2 gaming-gradient">Error Loading Clipts</h3>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Failed to load clips"}
          </p>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
            className="gaming-button"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gaming-400" />
      </div>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden bg-[#1A1F2C]">
      {/* Create Button - Fixed at the top right */}
      <div className="absolute top-4 right-4 z-50">
        <Button 
          onClick={() => navigate('/clip-editor/new')}
          className="gaming-button gap-2 bg-gaming-400 hover:bg-gaming-500"
        >
          <Plus className="h-4 w-4" />
          Create Clipt
        </Button>
      </div>

      {/* Vertical Scroll Container */}
      <div className="h-full overflow-y-auto snap-y snap-mandatory">
        {!posts || posts.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center gaming-card p-8">
              <h3 className="text-xl font-semibold mb-2 gaming-gradient">No Clipts Yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to share an amazing gaming moment!
              </p>
              <Button 
                onClick={() => navigate('/clip-editor/new')}
                variant="outline"
                className="gaming-button"
              >
                Create Your First Clipt
              </Button>
            </div>
          </div>
        ) : (
          posts?.map((post) => (
            <div 
              key={post.id} 
              className="h-screen w-full snap-start snap-always"
            >
              <div className="relative h-full w-full bg-[#1A1F2C] touch-none select-none">
                {/* Post Content */}
                <PostContent
                  imageUrl={post.image_url}
                  videoUrl={post.video_url}
                  postId={post.id}
                />
                
                {/* Post Interactions */}
                <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium">
                        {post.profiles?.username || 'Anonymous'}
                      </span>
                    </div>
                    <PostInteractions 
                      post={post}
                      commentsCount={post.comments?.[0]?.count || 0}
                      onCommentClick={() => navigate(`/comments/${post.id}`)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <GameBoyControls />
    </div>
  );
};

export default Clipts;