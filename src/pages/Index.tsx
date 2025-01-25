import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Gamepad2, Video, Users, Trophy } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-foreground"
          >
            Share Your Epic Gaming Moments
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground"
          >
            Join the ultimate gaming community where you can stream, share clips,
            and connect with fellow gamers.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button 
              size="lg" 
              onClick={() => navigate('/signup')}
              className="text-lg"
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/docs/getting-started')}
              className="text-lg"
            >
              Learn More
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard 
            icon={<Video className="w-8 h-8" />}
            title="Live Streaming"
            description="Stream your gameplay with high-quality video and interactive features"
          />
          <FeatureCard 
            icon={<Gamepad2 className="w-8 h-8" />}
            title="Gaming Clips"
            description="Share and discover the best gaming moments from the community"
          />
          <FeatureCard 
            icon={<Users className="w-8 h-8" />}
            title="Community"
            description="Connect with fellow gamers and build your following"
          />
          <FeatureCard 
            icon={<Trophy className="w-8 h-8" />}
            title="Achievements"
            description="Earn rewards and level up as you engage with the platform"
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="p-6 rounded-lg bg-card border border-border hover:border-primary transition-colors"
    >
      <div className="mb-4 text-primary">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </motion.div>
  );
}