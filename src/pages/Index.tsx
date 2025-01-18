import { useEffect } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { SeasonBanner } from "@/components/seasons/SeasonBanner";
import { XPMultipliersList } from "@/components/multipliers/XPMultipliersList";
import { ActiveChallenges } from "@/components/challenges/ActiveChallenges";
import PostList from "@/components/PostList";
import { ContentRecommendations } from "@/components/recommendations/ContentRecommendations";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export default function Index() {
  const { user } = useAuth();

  const { data: userLevel, isLoading: levelLoading } = useQuery({
    queryKey: ['user-level', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('user_levels')
        .select('current_level, current_xp, total_xp')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user
  });

  return (
    <>
      <Helmet>
        <title>Clip - Share Your Gaming Moments</title>
        <meta name="description" content="Join the ultimate gaming community. Share your best gaming moments, stream live, and connect with fellow gamers." />
        <meta name="keywords" content="gaming, clips, streaming, gaming community, esports" />
        
        {/* OpenGraph Tags */}
        <meta property="og:title" content="Clip - Share Your Gaming Moments" />
        <meta property="og:description" content="Join the ultimate gaming community. Share your best gaming moments, stream live, and connect with fellow gamers." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/og-image.png" />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Clip - Share Your Gaming Moments" />
        <meta name="twitter:description" content="Join the ultimate gaming community. Share your best gaming moments, stream live, and connect with fellow gamers." />
        <meta name="twitter:image" content="/og-image.png" />
      </Helmet>

      <div className="container mx-auto p-4 space-y-8">
        <SeasonBanner />
        
        {user && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="bg-card rounded-lg p-4 mb-6">
                <h2 className="text-2xl font-bold mb-2">Welcome Back{userLevel ? `, Level ${userLevel.current_level}` : ''}</h2>
                {levelLoading ? (
                  <Skeleton className="h-4 w-24" />
                ) : userLevel && (
                  <p className="text-muted-foreground">
                    XP: {userLevel.current_xp} / {(userLevel.current_level + 1) * 100}
                  </p>
                )}
              </div>
              
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Trending Now</h2>
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <PostList />
                </ScrollArea>
              </div>
            </div>

            <div className="space-y-6">
              <XPMultipliersList />
              <ActiveChallenges />
              <ContentRecommendations />
            </div>
          </div>
        )}

        {!user && (
          <div className="space-y-6">
            <div className="text-center py-12">
              <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gaming-400 to-gaming-600">
                Share Your Epic Gaming Moments
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands of gamers sharing their best plays, fails, and everything in between
              </p>
            </div>
            <PostList />
          </div>
        )}
      </div>
    </>
  );
}