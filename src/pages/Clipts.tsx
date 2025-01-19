import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostItem from "@/components/PostItem";
import { Loader2, Plus } from "lucide-react";
import GameBoyControls from "@/components/GameBoyControls";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Clipts = () => {
  const navigate = useNavigate();

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

      if (error) {
        toast.error("Failed to load clips");
        throw error;
      }
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Create Button - Fixed at the top right */}
      <div className="absolute top-4 right-4 z-50">
        <Button 
          onClick={() => navigate('/clip-editor/new')}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Clipt
        </Button>
      </div>

      {/* Vertical Scroll Container */}
      <div className="h-full overflow-y-auto snap-y snap-mandatory">
        {posts?.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">No Clipts Yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to share an amazing gaming moment!
              </p>
              <Button 
                onClick={() => navigate('/clip-editor/new')}
                variant="outline"
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
              <PostItem 
                post={{
                  ...post,
                  likes_count: post.likes?.[0]?.count || 0,
                  clip_votes: post.clip_votes || []
                }} 
              />
            </div>
          ))
        )}
      </div>

      <GameBoyControls />
    </div>
  );
};

export default Clipts;