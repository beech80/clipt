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
      className="space-y-6"
    >
      <section className="glass-card p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 gaming-gradient">Featured Content</h2>
        <FeaturedCarousel />
      </section>

      <section className="glass-card p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 gaming-gradient">Your Feed</h2>
        <EnhancedFeed />
      </section>

      <section className="glass-card p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 gaming-gradient">Active Tournaments</h2>
        <TournamentList />
      </section>

      <section className="glass-card p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 gaming-gradient">Your Squads</h2>
        <SquadList />
      </section>
    </motion.div>
  );
};