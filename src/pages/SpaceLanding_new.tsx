import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Video, Camera, Users, MessageSquare, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';

// Define simple types to avoid TypeScript errors
interface Star {
  id: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  blinkSpeed: number;
  delay: number;
}

const SpaceLanding: React.FC = () => {
  const navigate = useNavigate();
  const [stars, setStars] = useState<Star[]>([]);

  // Generate stars on component mount
  useEffect(() => {
    const generatedStars: Star[] = Array.from({ length: 100 }).map((_, i) => ({
      id: `star-${i}`,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.8 + 0.2,
      blinkSpeed: Math.random() * 5 + 1,
      delay: Math.random() * 5
    }));
    
    setStars(generatedStars);

    return () => {
      // Cleanup function
    };
  }, []);

  // Handle navigation to different sections
  const handleNavigation = (path: string): void => {
    navigate(path);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-b from-purple-900 via-[#190033] to-[#0D001A]">
      {/* Stars background */}
      <div className="absolute inset-0 z-0">
        {stars.map((star) => (
          <motion.div 
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              boxShadow: `0 0 ${star.size * 2}px ${star.size/2}px rgba(255, 255, 255, 0.8)`
            }}
            animate={{
              opacity: [star.opacity, star.opacity * 0.5, star.opacity],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: star.blinkSpeed,
              repeat: Infinity,
              ease: "easeInOut",
              delay: star.delay
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-purple-700 mb-4">
            Cosmic Galaxy
          </h1>
          <p className="text-lg md:text-xl text-purple-200 max-w-lg mx-auto">
            Explore the ultimate interstellar experience with our cosmic community
          </p>
        </motion.div>

        {/* Navigation buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto">
          <motion.button
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNavigation('/squadchat')}
            className="flex flex-col items-center justify-center p-4 rounded-lg bg-purple-900/50 backdrop-blur-sm border border-purple-500/30 text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <MessageSquare className="h-8 w-8 mb-2 text-purple-300" />
            <span>Squad Chat</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNavigation('/games')}
            className="flex flex-col items-center justify-center p-4 rounded-lg bg-purple-900/50 backdrop-blur-sm border border-purple-500/30 text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Gamepad2 className="h-8 w-8 mb-2 text-purple-300" />
            <span>Cosmic Games</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNavigation('/videos')}
            className="flex flex-col items-center justify-center p-4 rounded-lg bg-purple-900/50 backdrop-blur-sm border border-purple-500/30 text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Video className="h-8 w-8 mb-2 text-purple-300" />
            <span>Space Videos</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNavigation('/photos')}
            className="flex flex-col items-center justify-center p-4 rounded-lg bg-purple-900/50 backdrop-blur-sm border border-purple-500/30 text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Camera className="h-8 w-8 mb-2 text-purple-300" />
            <span>Space Photos</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNavigation('/users')}
            className="flex flex-col items-center justify-center p-4 rounded-lg bg-purple-900/50 backdrop-blur-sm border border-purple-500/30 text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Users className="h-8 w-8 mb-2 text-purple-300" />
            <span>Cosmic Users</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNavigation('/explore')}
            className="flex flex-col items-center justify-center p-4 rounded-lg bg-purple-900/50 backdrop-blur-sm border border-purple-500/30 text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Rocket className="h-8 w-8 mb-2 text-purple-300" />
            <span>Explore Galaxy</span>
          </motion.button>
        </div>

        {/* Call to action buttons */}
        <motion.div 
          className="mt-12 flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNavigation('/start')}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-white font-medium shadow-lg shadow-purple-600/30"
          >
            START GAME
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNavigation('/menu')}
            className="px-8 py-3 bg-black/40 border border-purple-500/30 backdrop-blur-sm rounded-lg text-white font-medium"
          >
            SELECT MENU
          </motion.button>
        </motion.div>
      </div>

      {/* CSS for twinkling stars */}
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default SpaceLanding;
