import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Video, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

const PostTypeSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if coming from squads page to pre-select the destination
  useEffect(() => {
    const fromSquadsPage = location.state?.fromSquads || false;
    if (fromSquadsPage) {
      setSelectedOption('squadsClipts');
    }
  }, [location.state]);

  // Enhanced animation variants
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
  
  // Simulate loading for a better experience
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleSelection = (type: string) => {
    setSelectedOption(type);
    
    // Add delay for animation to complete
    setTimeout(() => {
      if (type === 'clipts') {
        // Video only - go to editor first with trim functionality
        navigate('/video-editor');
      } else if (type === 'squadsClipts') {
        // Go directly to post form
        navigate('/post-form');
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md">
      {/* Dark overlay */}
      <motion.div 
        className="absolute inset-0 bg-black/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      
      <AnimatePresence>
        {isLoading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 text-center p-8"
          >
            <div className="loading-ring">
              <div className="loading-ring-circle"></div>
              <div className="loading-ring-circle"></div>
              <div className="loading-ring-circle"></div>
              <div className="loading-ring-circle"></div>
            </div>
            <motion.p 
              className="mt-4 text-white text-lg font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.5 } }}
            >
              Loading options...
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={containerVariants}
            className="relative z-10 bg-gray-900/90 border border-purple-500/50 rounded-xl p-6 max-w-md w-full shadow-xl shadow-purple-500/20"
          >
            {/* Close button */}
            <motion.button
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              onClick={() => navigate(-1)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <X size={20} />
            </motion.button>
            
            <div className="text-center mb-6">
              <motion.h1 
                className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Where to Post?
              </motion.h1>
              <motion.p
                className="text-gray-400 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Choose your destination
              </motion.p>
            </div>
        
            <div className="grid grid-cols-2 gap-4">
              <motion.div 
                className={`relative overflow-hidden rounded-lg cursor-pointer ${selectedOption === 'clipts' ? 'scale-105' : ''}`}
                variants={itemVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => handleSelection('clipts')}
              >
                <div className={`p-4 border-2 border-violet-500 rounded-lg bg-gray-900/70 backdrop-blur-sm ${selectedOption === 'clipts' ? 'bg-violet-500/20' : ''}`}>
                  {selectedOption === 'clipts' && (
                    <motion.div 
                      className="absolute inset-0 rounded-lg" 
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: 1,
                        boxShadow: ['0 0 0 rgba(139, 92, 246, 0)', '0 0 20px rgba(139, 92, 246, 0.5)', '0 0 10px rgba(139, 92, 246, 0.3)'],
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        repeatType: 'reverse' 
                      }}
                    />
                  )}
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-violet-500 rounded-full p-3 mb-2 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 to-violet-600 opacity-50 animate-spin-slow"></div>
                      <Video className="h-6 w-6 text-white relative z-10" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Clipts</h3>
                      <p className="text-gray-400 text-xs">Public videos</p>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className={`relative overflow-hidden rounded-lg cursor-pointer ${selectedOption === 'squadsClipts' ? 'scale-105' : ''}`}
                variants={itemVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => handleSelection('squadsClipts')}
              >
                <div className={`p-4 border-2 border-cyan-500 rounded-lg bg-gray-900/70 backdrop-blur-sm ${selectedOption === 'squadsClipts' ? 'bg-cyan-500/20' : ''}`}>
                  {selectedOption === 'squadsClipts' && (
                    <motion.div 
                      className="absolute inset-0 rounded-lg" 
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: 1,
                        boxShadow: ['0 0 0 rgba(14, 165, 233, 0)', '0 0 20px rgba(14, 165, 233, 0.5)', '0 0 10px rgba(14, 165, 233, 0.3)'],
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        repeatType: 'reverse' 
                      }}
                    />
                  )}
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-cyan-500 rounded-full p-3 mb-2 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-cyan-600 opacity-50 animate-spin-slow"></div>
                      <Users className="h-6 w-6 text-white relative z-10" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Squads Clipts</h3>
                      <p className="text-gray-400 text-xs">Share with your squad</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
        
            {/* Logo at bottom */}
            <motion.div 
              className="mt-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="inline-block rounded-full p-2 bg-gradient-to-r from-violet-500 via-pink-500 to-cyan-500">
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
        )}
      </AnimatePresence>
      
      {/* Floating particles background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div 
            key={i}
            className={`absolute w-${Math.floor(Math.random() * 3) + 1} h-${Math.floor(Math.random() * 3) + 1} rounded-full`}
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
    </div>
  );
};

export default PostTypeSelection;
