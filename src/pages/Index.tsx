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
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Index() {
  const { user } = useAuth();
  const { isCompleted } = useOnboarding();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: profileData, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['profile', user?.id],
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
    enabled: !!user?.id,
  });

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            There was an error loading your profile. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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

      <main 
        role="main"
        aria-label="Home page content"
        className="min-h-screen bg-gradient-to-b from-gaming-900 to-gaming-800"
      >
        <div className={`container mx-auto ${isMobile ? 'px-2' : 'px-4'} py-4 md:py-8 space-y-4 md:space-y-8`}>
          <AnimatePresence mode="wait">
            {user && !isCompleted && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gaming-800/50 backdrop-blur-sm border border-gaming-700/50 p-4 md:p-6 rounded-lg shadow-xl"
              >
                <OnboardingProgress />
                <Button
                  onClick={() => navigate('/onboarding')}
                  className="mt-4 bg-gaming-600 hover:bg-gaming-500 text-white w-full md:w-auto"
                >
                  Continue Onboarding
                </Button>
              </motion.div>
            )}

            <SeasonBanner />
            
            {user ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 md:space-y-8"
              >
                <motion.section 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-xl"
                  aria-label="Featured content"
                >
                  <FeaturedCarousel />
                </motion.section>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-2 space-y-4 md:space-y-8"
                    role="region"
                    aria-label="Main content"
                  >
                    <nav aria-label="Social feed navigation">
                      <EnhancedFeed />
                    </nav>
                    <section 
                      className="bg-gaming-800/50 backdrop-blur-sm border border-gaming-700/50 rounded-xl p-4 md:p-6"
                      aria-label="Active tournaments"
                    >
                      <TournamentList />
                    </section>
                    <section 
                      className="bg-gaming-800/50 backdrop-blur-sm border border-gaming-700/50 rounded-xl p-4 md:p-6"
                      aria-label="Your squads"
                    >
                      <SquadList />
                    </section>
                  </motion.div>

                  <motion.aside 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4 md:space-y-6"
                    role="complementary"
                    aria-label="Additional information"
                  >
                    <ScrollArea className={`${isMobile ? 'h-[400px]' : 'h-[calc(100vh-2rem)]'} pr-4`}>
                      <div className="space-y-4">
                        <section className="bg-gaming-800/50 backdrop-blur-sm border border-gaming-700/50 rounded-xl p-4 md:p-6">
                          <XPMultipliersList />
                        </section>
                        <section className="bg-gaming-800/50 backdrop-blur-sm border border-gaming-700/50 rounded-xl p-4 md:p-6">
                          <ActiveChallenges />
                        </section>
                        <section className="bg-gaming-800/50 backdrop-blur-sm border border-gaming-700/50 rounded-xl p-4 md:p-6">
                          <GamingHistory />
                        </section>
                        <section className="bg-gaming-800/50 backdrop-blur-sm border border-gaming-700/50 rounded-xl p-4 md:p-6">
                          <ContentRecommendations />
                        </section>
                      </div>
                    </ScrollArea>
                  </motion.aside>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
                role="region"
                aria-label="Welcome section"
              >
                <header 
                  className={`text-center py-8 ${isMobile ? 'py-12' : 'py-16'} relative overflow-hidden`}
                  role="banner"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-gaming-600/20 to-gaming-400/20 animate-gradient" />
                  <motion.h1 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`${isMobile ? 'text-3xl' : 'text-5xl'} font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gaming-400 to-gaming-600`}
                    tabIndex={0}
                  >
                    Share Your Epic Gaming Moments
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg md:text-xl text-gaming-300 mb-8 max-w-2xl mx-auto px-4"
                    tabIndex={0}
                  >
                    Join thousands of gamers sharing their best plays, fails, and everything in between
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Button
                      onClick={() => navigate('/signup')}
                      className="bg-gaming-500 hover:bg-gaming-400 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Get Started
                    </Button>
                  </motion.div>
                </header>
                <section 
                  aria-label="Latest posts"
                  tabIndex={0}
                  className="bg-gaming-800/50 backdrop-blur-sm border border-gaming-700/50 rounded-xl p-4 md:p-6"
                >
                  <PostList />
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </>
  );
}
