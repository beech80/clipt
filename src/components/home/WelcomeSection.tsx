import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Users, MessageSquare, Video } from "lucide-react";

export const WelcomeSection = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <header 
      className={`text-center py-8 ${isMobile ? 'py-12' : 'py-16'} relative overflow-hidden`}
      role="banner"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-gaming-600/20 to-gaming-400/20 animate-gradient" />
      
      {/* Navigation Buttons */}
      <div className="flex justify-center gap-4 mb-6">
        <Button 
          variant="outline" 
          className="gaming-button flex items-center gap-2"
          onClick={() => navigate('/post-form')}
        >
          <MessageSquare className="w-4 h-4" />
          Post
        </Button>
        <Button 
          variant="outline" 
          className="gaming-button flex items-center gap-2"
          onClick={() => navigate('/streaming')}
        >
          <Video className="w-4 h-4" />
          Stream
        </Button>
        <Button 
          variant="outline" 
          className="gaming-button flex items-center gap-2"
          onClick={() => navigate('/squads')}
        >
          <Users className="w-4 h-4" />
          Squads
        </Button>
      </div>

      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`${isMobile ? 'text-3xl' : 'text-5xl'} font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gaming-400 to-gaming-600`}
        tabIndex={0}
      >
        Share Your Epic Gaming Moments
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-lg md:text-xl text-gaming-300 mb-8 max-w-2xl mx-auto px-4"
        tabIndex={0}
      >
        Join thousands of gamers sharing their best plays, fails, and everything in between. Stream live or share clips!
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
  );
};