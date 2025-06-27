import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const MobileStreamButton: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isPressed, setIsPressed] = useState(false);

  const handleGoLive = () => {
    if (!user) {
      toast.error("Please log in to start streaming");
      navigate('/login');
      return;
    }

    setIsPressed(true);
    
    // Show toast while preparing
    toast.loading("Preparing your stream...");
    
    // Check for media permissions first
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(() => {
        // Use setTimeout to give visual feedback of button press
        setTimeout(() => {
          setIsPressed(false);
          navigate('/mobile-stream');
          toast.dismiss();
          toast.success("You're going live!");
        }, 500);
      })
      .catch(err => {
        setIsPressed(false);
        console.error("Media access error:", err);
        toast.dismiss();
        toast.error("Camera permission denied. Please enable camera access.");
      });
  };

  // Animation variants
  const buttonVariants = {
    rest: {
      scale: 1,
      boxShadow: "0 0 15px rgba(255, 85, 0, 0.3)",
    },
    hover: {
      scale: 1.05,
      boxShadow: "0 0 25px rgba(255, 85, 0, 0.5)",
    },
    pressed: {
      scale: 0.95,
      boxShadow: "0 0 10px rgba(255, 85, 0, 0.3)",
    }
  };

  // Animated glow effect
  const glowVariants = {
    rest: { opacity: 0.5, scale: 1 },
    hover: { 
      opacity: 0.8, 
      scale: 1.2,
      transition: {
        duration: 0.3,
        yoyo: Infinity,
        repeatDelay: 0.5
      }
    }
  };

  // Ripple effect when pressed
  const rippleVariants = {
    initial: { scale: 0, opacity: 0.7 },
    animate: { 
      scale: 4, 
      opacity: 0,
      transition: { duration: 1 }
    }
  };

  return (
    <div className="flex items-center">
      <motion.div
        className="relative"
        initial="rest"
        whileHover="hover"
        animate={isPressed ? "pressed" : "rest"}
      >
        {/* Glow effect behind button */}
        <motion.div
          className="absolute inset-0 rounded-full bg-orange-500"
          variants={glowVariants}
          style={{ 
            filter: 'blur(15px)', 
            zIndex: -1,
          }}
        />
        
        {/* Ripple effect on press */}
        {isPressed && (
          <motion.div
            className="absolute inset-0 bg-orange-500 rounded-full"
            variants={rippleVariants}
            initial="initial"
            animate="animate"
            style={{ 
              zIndex: -1,
            }}
          />
        )}
        
        {/* Main button */}
        <motion.button
          onClick={handleGoLive}
          className="flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full p-2 focus:outline-none gap-1"
          variants={buttonVariants}
          style={{ 
            boxShadow: '0 0 15px rgba(255, 85, 0, 0.3)',
          }}
        >
          <div className="relative">
            <Video className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </div>
          <span className="text-xs font-bold">LIVE PHONE</span>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default MobileStreamButton;
