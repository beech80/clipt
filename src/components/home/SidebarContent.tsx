import { motion } from "framer-motion";
import { ContentRecommendations } from "@/components/recommendations/ContentRecommendations";
import { TrendingHashtags } from "@/components/hashtags/TrendingHashtags";
import { XPMultipliersList } from "@/components/multipliers/XPMultipliersList";
import { ActiveChallenges } from "@/components/challenges/ActiveChallenges";
import ErrorBoundary from "@/components/ErrorBoundary";

export const SidebarContent = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="hidden lg:block space-y-6"
    >
      <div className="sticky top-6 space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gaming-900/40 backdrop-blur-sm border border-gaming-300/10 rounded-xl p-4 shadow-lg hover:shadow-gaming-300/5 transition-all duration-300"
        >
          <h2 className="text-lg font-semibold text-gaming-100 mb-4">Recommended</h2>
          <ErrorBoundary>
            <ContentRecommendations />
          </ErrorBoundary>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gaming-900/40 backdrop-blur-sm border border-gaming-300/10 rounded-xl p-4 shadow-lg hover:shadow-gaming-300/5 transition-all duration-300"
        >
          <h2 className="text-lg font-semibold text-gaming-100 mb-4">Trending</h2>
          <ErrorBoundary>
            <TrendingHashtags />
          </ErrorBoundary>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gaming-900/40 backdrop-blur-sm border border-gaming-300/10 rounded-xl p-4 shadow-lg hover:shadow-gaming-300/5 transition-all duration-300"
        >
          <h2 className="text-lg font-semibold text-gaming-100 mb-4">XP Multipliers</h2>
          <ErrorBoundary>
            <XPMultipliersList />
          </ErrorBoundary>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gaming-900/40 backdrop-blur-sm border border-gaming-300/10 rounded-xl p-4 shadow-lg hover:shadow-gaming-300/5 transition-all duration-300"
        >
          <h2 className="text-lg font-semibold text-gaming-100 mb-4">Active Challenges</h2>
          <ErrorBoundary>
            <ActiveChallenges />
          </ErrorBoundary>
        </motion.section>
      </div>
    </motion.div>
  );
};