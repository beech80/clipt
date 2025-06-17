import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Video, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

const SpaceLanding: React.FC = () => {
  const navigate = useNavigate();

  // Animation for floating elements
  const floatAnimation = {
    initial: { y: 0 },
    animate: { 
      y: [0, -10, 0],
      transition: { 
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut" 
      }
    }
  };
  
  // Handle navigation to different sections
  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#190033] flex flex-col items-center justify-center">
      {/* Stars background */}
      <div className="absolute inset-0 z-0">
        {Array.from({ length: 100 }).map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.8 + 0.2,
              animation: `twinkle ${Math.random() * 3 + 2}s infinite ${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Floating elements */}
      <div className="absolute inset-0 z-0">
        {/* Game-themed floating elements instead of emojis */}
        <motion.div 
          className="absolute w-12 h-12 text-gray-300"
          style={{ top: '10%', left: '15%', transform: 'rotate(15deg)' }}
          {...floatAnimation}
        >
          <Gamepad2 size={32} className="text-blue-200" />
        </motion.div>
        <motion.div 
          className="absolute w-12 h-12 text-gray-300"
          style={{ top: '20%', right: '20%', transform: 'rotate(-20deg)' }}
          {...floatAnimation}
        >
          <Video size={32} className="text-purple-300" />
        </motion.div>
        <motion.div 
          className="absolute w-12 h-12 text-gray-300"
          style={{ bottom: '15%', left: '25%' }}
          {...floatAnimation}
        >
          <Camera size={32} className="text-cyan-200" />
        </motion.div>
        <motion.div 
          className="absolute w-8 h-8 text-blue-200"
          style={{ top: '30%', left: '80%' }}
          {...floatAnimation}
        >
          <Gamepad2 size={24} className="text-green-200" />
        </motion.div>
        <motion.div 
          className="absolute w-6 h-6"
          style={{ bottom: '30%', right: '18%' }}
          {...floatAnimation}
        >
          <Video size={20} className="text-pink-200" />
        </motion.div>
        
        {/* Planets */}
        <motion.div 
          className="absolute w-16 h-16"
          style={{ bottom: '70%', left: '10%' }}
          {...floatAnimation}
        >
          <div className="w-full h-full rounded-full bg-blue-400 opacity-70"></div>
        </motion.div>
        <motion.div 
          className="absolute w-10 h-10"
          style={{ top: '15%', right: '10%' }}
          {...floatAnimation}
        >
          <div className="w-full h-full rounded-full bg-orange-500 opacity-60"></div>
        </motion.div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-8">
        {/* CLIPT Logo */}
        <motion.div 
          className="flex flex-col items-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 drop-shadow-[0_0_15px_rgba(59,130,246,0.7)]">
            CLIPT
          </h1>
        </motion.div>

        {/* Menu buttons */}
        <div className="flex items-center justify-center gap-8">
          <motion.button
            className="flex flex-col items-center justify-center w-24 h-24 bg-black/30 hover:bg-black/50 rounded-md backdrop-blur-sm border border-gray-700 text-white transition-all"
            whileHover={{ scale: 1.05, y: -5 }}
            onClick={() => handleNavigation('/all-streamers')}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Video className="w-8 h-8 mb-2" />
            <span className="text-xs uppercase font-medium">Streaming</span>
          </motion.button>

          <motion.button
            className="flex flex-col items-center justify-center w-24 h-24 bg-black/30 hover:bg-black/50 rounded-md backdrop-blur-sm border border-gray-700 text-white transition-all"
            whileHover={{ scale: 1.05, y: -5 }}
            onClick={() => handleNavigation('/posts')}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Camera className="w-8 h-8 mb-2" />
            <span className="text-xs uppercase font-medium">Posts</span>
          </motion.button>
        </div>

        {/* Start Game button */}
        <motion.button
          className="mt-8 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-md shadow-lg shadow-blue-500/25 text-white font-medium flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleNavigation('/clipts')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          START GAME <Gamepad2 className="ml-2 w-4 h-4" />
        </motion.button>
        
        {/* SELECT button for Game Menu */}
        <motion.button
          className="mt-4 px-6 py-2 bg-gradient-to-r from-gray-700/80 to-gray-900/80 hover:from-gray-600/80 hover:to-gray-800/80 border border-gray-500/30 rounded-md text-white font-medium flex items-center justify-center text-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleNavigation('/game-menu')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          SELECT MENU
        </motion.button>
      </div>

      {/* CSS Animations */}
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
