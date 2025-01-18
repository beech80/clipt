import { Helmet } from "react-helmet";
import { useAuth } from "@/contexts/AuthContext";
import { SeasonBanner } from "@/components/seasons/SeasonBanner";
import { XPMultipliersList } from "@/components/multipliers/XPMultipliersList";
import { ActiveChallenges } from "@/components/challenges/ActiveChallenges";
import { ContentRecommendations } from "@/components/recommendations/ContentRecommendations";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SquadList } from "@/components/squads/SquadList";
import { EnhancedFeed } from "@/components/social/EnhancedFeed";
import { FeaturedCarousel } from "@/components/content/FeaturedCarousel";
import { GamingHistory } from "@/components/gaming/GamingHistory";
import { TournamentList } from "@/components/tournaments/TournamentList";
import PostList from "@/components/PostList"; // Added this import

export default function Index() {
  const { user } = useAuth();

  return (
    <>
      <Helmet>
        <title>Clip - Share Your Gaming Moments</title>
        <meta name="description" content="Join the ultimate gaming community. Share your best gaming moments, stream live, and connect with fellow gamers." />
        <meta name="keywords" content="gaming, clips, streaming, gaming community, esports" />
        
        <meta property="og:title" content="Clip - Share Your Gaming Moments" />
        <meta property="og:description" content="Join the ultimate gaming community. Share your best gaming moments, stream live, and connect with fellow gamers." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/og-image.png" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Clip - Share Your Gaming Moments" />
        <meta name="twitter:description" content="Join the ultimate gaming community. Share your best gaming moments, stream live, and connect with fellow gamers." />
        <meta name="twitter:image" content="/og-image.png" />
      </Helmet>

      <div className="container mx-auto p-4 space-y-8">
        <SeasonBanner />
        
        {user ? (
          <>
            <FeaturedCarousel />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <EnhancedFeed />
                <TournamentList />
                <SquadList />
              </div>

              <div className="space-y-8">
                <XPMultipliersList />
                <ActiveChallenges />
                <GamingHistory />
                <ContentRecommendations />
              </div>
            </div>
          </>
        ) : (
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