import PostList from "@/components/PostList";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import PostForm from "@/components/PostForm";
import GameBoyControls from "@/components/GameBoyControls";
import { StoriesBar } from "@/components/stories/StoriesBar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { User, Heart, MessageSquare, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

const Home = () => {
  const [isPostFormOpen, setIsPostFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("feed");
  const { user } = useAuth();

  const { data: userStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const [likesCount, commentsCount, achievementsCount] = await Promise.all([
        supabase
          .from('likes')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .then(({ count }) => count),
        supabase
          .from('comments')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .then(({ count }) => count),
        supabase
          .from('user_achievements')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .then(({ count }) => count)
      ]);

      return {
        likes: likesCount || 0,
        comments: commentsCount || 0,
        achievements: achievementsCount || 0
      };
    },
    enabled: !!user?.id
  });

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  return (
    <div className="h-[calc(100vh-80px)] relative">
      <div className="absolute top-0 left-0 right-0 z-20">
        <div className="w-full bg-[#1A1F2C]/80 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            {user && (
              <Card className="w-full p-4 mb-4 border-none bg-transparent">
                <div className="flex items-center justify-between px-4">
                  <div className="flex items-center space-x-4">
                    {isLoadingProfile ? (
                      <Skeleton className="h-10 w-10 rounded-full" />
                    ) : (
                      <Avatar className="h-10 w-10 border-2 border-gaming-500">
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="space-y-1">
                      {isLoadingProfile ? (
                        <Skeleton className="h-4 w-24" />
                      ) : (
                        <p className="text-sm font-medium leading-none">
                          {profile?.username || 'User'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-6">
                    <div className="flex items-center space-x-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium">
                        {isLoadingStats ? <Skeleton className="h-4 w-8" /> : userStats?.likes || 0}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-gaming-400" />
                      <span className="text-sm font-medium">
                        {isLoadingStats ? <Skeleton className="h-4 w-8" /> : userStats?.comments || 0}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">
                        {isLoadingStats ? <Skeleton className="h-4 w-8" /> : userStats?.achievements || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}
            <StoriesBar />
            <div className="w-full h-12 sm:h-14">
              <div className="flex w-full h-full">
                <Dialog open={isPostFormOpen} onOpenChange={setIsPostFormOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="relative h-full w-1/2 bg-gradient-to-b from-gaming-700/40 to-gaming-800/50 
                      border-y-2 border-l-2 border-gaming-400/50 text-white hover:from-gaming-700/50 hover:to-gaming-800/60
                      active:from-gaming-700/60 active:to-gaming-800/70 transform active:translate-y-0.5
                      transition-all duration-200 shadow-[0_0_15px_rgba(155,135,245,0.3)]
                      hover:shadow-[0_0_20px_rgba(155,135,245,0.4)] rounded-none
                      text-sm sm:text-base touch-manipulation"
                    >
                      <span className="flex items-center -skew-x-12">
                        <Video className="w-4 h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">POST</span>
                        <span className="sm:hidden">+</span>
                      </span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] w-[95%] mx-auto">
                    <PostForm onPostCreated={() => setIsPostFormOpen(false)} />
                  </DialogContent>
                </Dialog>

                <div className="w-[2px] h-full bg-gaming-400/50" />

                <Button 
                  className={`relative h-full w-1/2 bg-gradient-to-b from-gaming-700/40 to-gaming-800/50 
                  border-y-2 border-r-2 border-gaming-400/50 text-white hover:from-gaming-700/50 hover:to-gaming-800/60
                  active:from-gaming-700/60 active:to-gaming-800/70 transform active:translate-y-0.5
                  transition-all duration-200 shadow-[0_0_15px_rgba(155,135,245,0.3)]
                  hover:shadow-[0_0_20px_rgba(155,135,245,0.4)] rounded-none text-sm sm:text-base touch-manipulation
                  ${activeTab === "squad" ? "from-gaming-600/50 to-gaming-700/60" : ""}`}
                  onClick={() => setActiveTab(activeTab === "squad" ? "feed" : "squad")}
                >
                  <span className="flex items-center -skew-x-12 font-bold tracking-wider">
                    <span className="hidden sm:inline">SQUADS</span>
                    <span className="sm:hidden">SQUAD</span>
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="retro-screen h-full pt-16 pb-[160px] sm:pb-[180px] overscroll-none">
        <PostList />
      </div>

      <GameBoyControls />
    </div>
  );
};

export default Home;