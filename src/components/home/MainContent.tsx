import { motion } from "framer-motion";
import { FeaturedCarousel } from "@/components/content/FeaturedCarousel";
import { EnhancedFeed } from "@/components/social/EnhancedFeed";
import { TournamentList } from "@/components/tournaments/TournamentList";
import { SquadList } from "@/components/squads/SquadList";

export const MainContent = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="lg:col-span-2 space-y-6 md:space-y-8"
      role="region"
      aria-label="Main content"
    >
      <nav aria-label="Social feed navigation" className="space-y-6">
        <EnhancedFeed />
      </nav>
      <section 
        className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 md:p-6"
        aria-label="Active tournaments"
      >
        <TournamentList />
      </section>
      <section 
        className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 md:p-6"
        aria-label="Your squads"
      >
        <SquadList />
      </section>
    </motion.div>
  );
};