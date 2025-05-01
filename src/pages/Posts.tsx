import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Users, Video } from 'lucide-react';
import BackButton from '@/components/BackButton';

const Posts = () => {
  const navigate = useNavigate();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1,
        duration: 0.4
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.9 },
    visible: { 
      y: 0, 
      opacity: 1,
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 400,
        damping: 25,
        duration: 0.5
      }
    },
    hover: {
      scale: 1.05,
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 15
      }
    },
    tap: {
      scale: 0.98,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 15
      }
    }
  };

  const handleSelection = (type: string) => {    
    // Add delay for animation to complete
    setTimeout(() => {
      if (type === 'clipts') {
        // Video only - go to editor first with trim functionality
        navigate('/video-editor');
      } else if (type === 'squadsClipts') {
        // Go directly to post form
        navigate('/post-form');
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-md">
      {/* Dark overlay with animated stars */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-b from-[#190033] to-[#0d1b3c]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Stars background */}
        <div className="absolute inset-0 z-0">
          {Array.from({ length: 50 }).map((_, i) => (
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
      </motion.div>

      {/* Header with back button */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-md px-4 py-3 border-b border-gray-800 flex items-center">
        <BackButton />
        <h1 className="text-2xl font-bold mx-auto text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
          Post Selection
        </h1>
      </div>
      
      <motion.div
        key="content"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={containerVariants}
        className="relative z-10 bg-gray-900/90 border border-orange-500/50 rounded-xl p-6 max-w-md w-full shadow-xl shadow-orange-500/20"
      >
        <h2 className="text-2xl font-bold text-center mb-6 text-white">Select Post Type</h2>
        
        <div className="grid grid-cols-1 gap-4 mt-4">
          <motion.div 
            className="relative overflow-hidden rounded-lg cursor-pointer"
            variants={itemVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => handleSelection('clipts')}
          >
            <div className="p-6 border-2 border-orange-500 rounded-lg bg-gray-900/70 backdrop-blur-sm hover:bg-orange-500/20 transition-colors">
              <div className="flex items-center">
                <div className="bg-orange-500 rounded-full p-4 mr-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-orange-400 to-orange-600 opacity-50 animate-pulse"></div>
                  <Scissors className="h-8 w-8 text-white relative z-10" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Post to Clipts</h3>
                  <p className="text-gray-300 mt-1">Create a video or photo clip</p>
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="relative overflow-hidden rounded-lg cursor-pointer"
            variants={itemVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => handleSelection('squadsClipts')}
          >
            <div className="p-6 border-2 border-cyan-500 rounded-lg bg-gray-900/70 backdrop-blur-sm hover:bg-cyan-500/20 transition-colors">
              <div className="flex items-center">
                <div className="bg-cyan-500 rounded-full p-4 mr-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-cyan-600 opacity-50 animate-spin-slow"></div>
                  <Users className="h-8 w-8 text-white relative z-10" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Post to Squads</h3>
                  <p className="text-gray-300 mt-1">Share with your squad</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      
        {/* Logo at bottom */}
        <motion.div 
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="inline-block rounded-full p-2 bg-gradient-to-r from-orange-500 via-pink-500 to-cyan-500">
            <div className="bg-gray-900 rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
            </div>
          </div>
        </motion.div>
      </motion.div>
      
      {/* Floating particles background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div 
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              boxShadow: '0 0 8px rgba(255, 255, 255, 0.5)',
            }}
            animate={{
              y: [0, Math.random() * 30, 0],
              x: [0, Math.random() * 30, 0],
              opacity: [0.2, 0.8, 0.2]
            }}
            transition={{
              repeat: Infinity,
              duration: 3 + Math.random() * 5,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Posts;
