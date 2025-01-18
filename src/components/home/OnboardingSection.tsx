import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";

interface OnboardingSectionProps {
  show: boolean;
}

export const OnboardingSection = ({ show }: OnboardingSectionProps) => {
  const navigate = useNavigate();

  if (!show) return null;

  return (
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
  );
};