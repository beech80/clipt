import { motion } from "framer-motion";
import { FeaturedCarousel } from "@/components/content/FeaturedCarousel";
import { EnhancedFeed } from "@/components/social/EnhancedFeed";
import { TournamentList } from "@/components/tournaments/TournamentList";
import { SquadList } from "@/components/squads/SquadList";
import ErrorBoundary from "@/components/ErrorBoundary";

export const MainContent = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="lg:col-span-2 space-y-6 md:space-y-8"
      role="region"
      aria-label="Main content area"
    >
      <div className="relative w-full overflow-hidden rounded-xl bg-gaming-900/40 backdrop-blur-sm border border-gaming-300/10 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-gaming-300/10 to-gaming-400/10" />
        <FeaturedCarousel />
      </div>

      <nav 
        aria-label="Social feed navigation" 
        className="space-y-6"
      >
        <ErrorBoundary>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <EnhancedFeed />
          </motion.div>
        </ErrorBoundary>
      </nav>

      <section 
        className="bg-gaming-900/40 backdrop-blur-sm border border-gaming-300/10 rounded-xl p-4 md:p-6 shadow-lg hover:shadow-gaming-300/5 transition-all duration-300"
        aria-label="Active tournaments"
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <ErrorBoundary>
            <TournamentList />
          </ErrorBoundary>
        </motion.div>
      </section>

      <section 
        className="bg-gaming-900/40 backdrop-blur-sm border border-gaming-300/10 rounded-xl p-4 md:p-6 shadow-lg hover:shadow-gaming-300/5 transition-all duration-300"
        aria-label="Your squads"
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ErrorBoundary>
            <SquadList />
          </ErrorBoundary>
        </motion.div>
      </section>
    </motion.div>
  );
};