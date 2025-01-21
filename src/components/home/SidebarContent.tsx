import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { XPMultipliersList } from "@/components/multipliers/XPMultipliersList";
import { ActiveChallenges } from "@/components/challenges/ActiveChallenges";
import { GamingHistory } from "@/components/gaming/GamingHistory";
import { ContentRecommendations } from "@/components/recommendations/ContentRecommendations";
import { useIsMobile } from "@/hooks/use-mobile";
import ErrorBoundary from "@/components/ErrorBoundary";

export const SidebarContent = () => {
  const isMobile = useIsMobile();

  return (
    <motion.aside 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4 md:space-y-6"
      role="complementary"
      aria-label="Additional information sidebar"
    >
      <ScrollArea 
        className={`${isMobile ? 'h-[400px]' : 'h-[calc(100vh-2rem)]'} pr-4`}
        aria-label="Scrollable sidebar content"
      >
        <div className="space-y-4">
          <section 
            className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 md:p-6"
            aria-label="XP Multipliers"
            tabIndex={0}
          >
            <ErrorBoundary>
              <XPMultipliersList />
            </ErrorBoundary>
          </section>

          <section 
            className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 md:p-6"
            aria-label="Active Challenges"
            tabIndex={0}
          >
            <ErrorBoundary>
              <ActiveChallenges />
            </ErrorBoundary>
          </section>

          <section 
            className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 md:p-6"
            aria-label="Gaming History"
            tabIndex={0}
          >
            <ErrorBoundary>
              <GamingHistory />
            </ErrorBoundary>
          </section>

          <section 
            className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 md:p-6"
            aria-label="Content Recommendations"
            tabIndex={0}
          >
            <ErrorBoundary>
              <ContentRecommendations />
            </ErrorBoundary>
          </section>
        </div>
      </ScrollArea>
    </motion.aside>
  );
};