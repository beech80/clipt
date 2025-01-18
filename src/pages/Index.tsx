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

/**
 * Index Page Component
 * 
 * This is the main landing page of the application. It serves different content
 * based on whether the user is authenticated or not.
 * 
 * For authenticated users, it shows:
 * - Personal welcome message with level information
 * - Trending posts
 * - XP multipliers
 * - Active challenges
 * - Personalized content recommendations
 * 
 * For non-authenticated users, it shows:
 * - Welcome hero section
 * - Trending posts to encourage sign-up
 * 
 * The page is fully responsive and uses a grid layout on larger screens.
 */
export default function Index() {
  // Get authentication context
  const { user } = useAuth();

  /**
   * Fetch user's level information
   * This query only runs when user is authenticated
   */
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
      {/* SEO and Social Sharing Meta Tags */}
      <Helmet>
        <title>Clip - Share Your Gaming Moments</title>
        <meta name="description" content="Join the ultimate gaming community. Share your best gaming moments, stream live, and connect with fellow gamers." />
        <meta name="keywords" content="gaming, clips, streaming, gaming community, esports" />
        
        {/* OpenGraph Tags for better social media sharing */}
        <meta property="og:title" content="Clip - Share Your Gaming Moments" />
        <meta property="og:description" content="Join the ultimate gaming community. Share your best gaming moments, stream live, and connect with fellow gamers." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/og-image.png" />
        
        {/* Twitter Card Tags for Twitter sharing */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Clip - Share Your Gaming Moments" />
        <meta name="twitter:description" content="Join the ultimate gaming community. Share your best gaming moments, stream live, and connect with fellow gamers." />
        <meta name="twitter:image" content="/og-image.png" />
      </Helmet>

      <div className="container mx-auto p-4 space-y-8">
        {/* Season Banner is shown to all users */}
        <SeasonBanner />
        
        {/* Authenticated User View */}
        {user && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="md:col-span-2">
              {/* User Level Card */}
              <div className="bg-card rounded-lg p-4 mb-6">
                <h2 className="text-2xl font-bold mb-2">
                  Welcome Back{userLevel ? `, Level ${userLevel.current_level}` : ''}
                </h2>
                {levelLoading ? (
                  <Skeleton className="h-4 w-24" />
                ) : userLevel && (
                  <p className="text-muted-foreground">
                    XP: {userLevel.current_xp} / {(userLevel.current_level + 1) * 100}
                  </p>
                )}
              </div>
              
              {/* Trending Posts Section */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Trending Now</h2>
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <PostList />
                </ScrollArea>
              </div>
            </div>

            {/* Sidebar Content */}
            <div className="space-y-6">
              <XPMultipliersList />
              <ActiveChallenges />
              <ContentRecommendations />
            </div>
          </div>
        )}

        {/* Non-Authenticated User View */}
        {!user && (
          <div className="space-y-6">
            {/* Hero Section */}
            <div className="text-center py-12">
              <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gaming-400 to-gaming-600">
                Share Your Epic Gaming Moments
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands of gamers sharing their best plays, fails, and everything in between
              </p>
            </div>
            {/* Show trending posts to encourage sign-up */}
            <PostList />
          </div>
        )}
      </div>
    </>
  );
}