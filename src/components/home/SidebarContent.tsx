import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { XPMultipliersList } from "@/components/multipliers/XPMultipliersList";
import { ActiveChallenges } from "@/components/challenges/ActiveChallenges";
import { GamingHistory } from "@/components/gaming/GamingHistory";
import { ContentRecommendations } from "@/components/recommendations/ContentRecommendations";
import { useIsMobile } from "@/hooks/use-mobile";

export const SidebarContent = () => {
  const isMobile = useIsMobile();

  return (
    <motion.aside 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4 md:space-y-6"
      role="complementary"
      aria-label="Additional information"
    >
      <ScrollArea className={`${isMobile ? 'h-[400px]' : 'h-[calc(100vh-2rem)]'} pr-4`}>
        <div className="space-y-4">
          <section className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 md:p-6">
            <XPMultipliersList />
          </section>
          <section className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 md:p-6">
            <ActiveChallenges />
          </section>
          <section className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 md:p-6">
            <GamingHistory />
          </section>
          <section className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 md:p-6">
            <ContentRecommendations />
          </section>
        </div>
      </ScrollArea>
    </motion.aside>
  );
};