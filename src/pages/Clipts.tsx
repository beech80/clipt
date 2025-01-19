import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostItem from "@/components/PostItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plus, Trophy, TrendingUp } from "lucide-react";
import GameBoyControls from "@/components/GameBoyControls";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold gaming-gradient mb-2">Clipts</h1>
          <p className="text-muted-foreground">
            Share and discover amazing gaming moments
          </p>
        </div>
        <Button 
          onClick={() => navigate('/clip-editor/new')}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Clipt
        </Button>
      </div>

      <Tabs defaultValue="trending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="trending" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="top" className="gap-2">
            <Trophy className="h-4 w-4" />
            Top Rated
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="space-y-4">
          {posts?.length === 0 ? (
            <Card className="p-8 text-center">
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
            </Card>
          ) : (
            <ScrollArea className="h-[calc(100vh-250px)]">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {posts?.map((post) => (
                  <div key={post.id} className="relative">
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
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="top" className="space-y-4">
          <Card className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">Top Rated Clipts</h3>
            <p className="text-muted-foreground">
              The most popular gaming moments from the community
            </p>
          </Card>
          {/* Top rated content will be implemented in the next iteration */}
        </TabsContent>
      </Tabs>

      <GameBoyControls />
    </div>
  );
};

export default Clipts;