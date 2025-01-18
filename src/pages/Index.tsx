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
import { motion } from "framer-motion";

export default function Index() {
  const { user } = useAuth();
  const { isCompleted } = useOnboarding();
  const navigate = useNavigate();

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
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
        <div className="container mx-auto px-4 py-8 space-y-8">
          {user && !isCompleted && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gaming-800/50 backdrop-blur-sm border border-gaming-700/50 p-6 rounded-lg shadow-xl"
            >
              <OnboardingProgress />
              <Button
                onClick={() => navigate('/onboarding')}
                className="mt-4 bg-gaming-600 hover:bg-gaming-500 text-white"
              >
                Continue Onboarding
              </Button>
            </motion.div>
          )}

          <SeasonBanner />
          
          {user ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-8"
            >
              <motion.section 
                variants={itemVariants}
                className="relative overflow-hidden rounded-xl"
                aria-label="Featured content"
              >
                <FeaturedCarousel />
              </motion.section>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div 
                  variants={itemVariants}
                  className="lg:col-span-2 space-y-8"
                  role="region"
                  aria-label="Main content"
                >
                  <nav aria-label="Social feed navigation">
                    <EnhancedFeed />
                  </nav>
                  <section 
                    className="bg-gaming-800/50 backdrop-blur-sm border border-gaming-700/50 rounded-xl p-6"
                    aria-label="Active tournaments"
                  >
                    <TournamentList />
                  </section>
                  <section 
                    className="bg-gaming-800/50 backdrop-blur-sm border border-gaming-700/50 rounded-xl p-6"
                    aria-label="Your squads"
                  >
                    <SquadList />
                  </section>
                </motion.div>

                <motion.aside 
                  variants={itemVariants}
                  className="space-y-6"
                  role="complementary"
                  aria-label="Additional information"
                >
                  <ScrollArea className="h-[calc(100vh-2rem)] pr-4">
                    <div className="space-y-6">
                      <section 
                        className="bg-gaming-800/50 backdrop-blur-sm border border-gaming-700/50 rounded-xl p-6"
                        aria-label="XP Multipliers"
                      >
                        <XPMultipliersList />
                      </section>
                      <section 
                        className="bg-gaming-800/50 backdrop-blur-sm border border-gaming-700/50 rounded-xl p-6"
                        aria-label="Active challenges"
                      >
                        <ActiveChallenges />
                      </section>
                      <section 
                        className="bg-gaming-800/50 backdrop-blur-sm border border-gaming-700/50 rounded-xl p-6"
                        aria-label="Gaming history"
                      >
                        <GamingHistory />
                      </section>
                      <section 
                        className="bg-gaming-800/50 backdrop-blur-sm border border-gaming-700/50 rounded-xl p-6"
                        aria-label="Recommended content"
                      >
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
                className="text-center py-16 relative overflow-hidden"
                role="banner"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gaming-600/20 to-gaming-400/20 animate-gradient" />
                <motion.h1 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gaming-400 to-gaming-600"
                  tabIndex={0}
                >
                  Share Your Epic Gaming Moments
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl text-gaming-300 mb-8 max-w-2xl mx-auto"
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
                className="bg-gaming-800/50 backdrop-blur-sm border border-gaming-700/50 rounded-xl p-6"
              >
                <PostList />
              </section>
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
}