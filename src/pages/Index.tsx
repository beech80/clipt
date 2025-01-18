import { SEO } from "@/components/SEO";
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
import PostList from "@/components/PostList";

export default function Index() {
  const { user } = useAuth();

  // Structured data for the organization/website
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Clip - Share Your Gaming Moments",
    "description": "Join the ultimate gaming community. Share your best gaming moments, stream live, and connect with fellow gamers.",
    "url": window.location.origin,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${window.location.origin}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <SEO 
        title="Clip - Share Your Gaming Moments"
        description="Join the ultimate gaming community. Share your best gaming moments, stream live, and connect with fellow gamers."
        type="website"
        structuredData={structuredData}
        route="/"
      />

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