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
      className="space-y-6"
    >
      <ScrollArea className={`${isMobile ? 'h-[400px]' : 'h-[calc(100vh-2rem)]'} pr-4`}>
        <div className="space-y-6">
          <section className="glass-card">
            <h2 className="text-xl font-bold mb-4 text-gaming-100">XP Multipliers</h2>
            <XPMultipliersList />
          </section>

          <section className="glass-card">
            <h2 className="text-xl font-bold mb-4 text-gaming-100">Active Challenges</h2>
            <ActiveChallenges />
          </section>

          <section className="glass-card">
            <h2 className="text-xl font-bold mb-4 text-gaming-100">Gaming History</h2>
            <GamingHistory />
          </section>

          <section className="glass-card">
            <h2 className="text-xl font-bold mb-4 text-gaming-100">Recommended</h2>
            <ContentRecommendations />
          </section>
        </div>
      </ScrollArea>
    </motion.aside>
  );
};