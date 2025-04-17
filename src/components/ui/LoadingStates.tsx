import React from "react";
import { Loader, AlertCircle, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LoadingProps {
  variant?: "default" | "spinner" | "skeleton" | "pulse" | "dots" | "gaming";
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  fullscreen?: boolean;
}

const pulseAnimation = {
  scale: [1, 1.1, 1],
  opacity: [0.6, 1, 0.6],
};

const dotsAnimation = {
  y: ["0%", "-30%", "0%"],
};

export const LoadingFallback: React.FC<LoadingProps> = ({
  variant = "default",
  message = "Loading...",
  className = "",
  size = "md",
  fullscreen = false,
}) => {
  const sizeMap = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const containerClasses = cn(
    "flex flex-col items-center justify-center",
    fullscreen ? "fixed inset-0 z-50 bg-gaming-950/80" : "h-full w-full min-h-[100px]",
    className
  );

  const renderGamingLoader = () => (
    <div className="relative">
      <motion.div
        className="p-4 bg-gaming-800 border border-purple-500/20 rounded-lg shadow-lg shadow-purple-900/20"
        animate={{ 
          boxShadow: ["0 0 0px rgba(168, 85, 247, 0.5)", "0 0 15px rgba(168, 85, 247, 0.8)", "0 0 0px rgba(168, 85, 247, 0.5)"]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Zap className="text-orange-500" size={size === "lg" ? 36 : size === "md" ? 24 : 16} />
      </motion.div>
      <motion.div
        className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-purple-500/0 via-purple-500 to-purple-500/0"
        animate={{ 
          left: ["-100%", "100%"],
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );

  if (variant === "skeleton") {
    return (
      <div className={containerClasses}>
        <div className="space-y-2 w-full max-w-md">
          <div className="h-6 bg-gaming-800 rounded animate-pulse"></div>
          <div className="h-32 bg-gaming-800 rounded animate-pulse"></div>
          <div className="h-4 bg-gaming-800 rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-gaming-800 rounded animate-pulse w-1/2"></div>
        </div>
      </div>
    );
  }
  
  if (variant === "pulse") {
    return (
      <div className={containerClasses}>
        <motion.div
          animate={pulseAnimation}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="bg-purple-500 rounded-full"
        >
          <Loader className={`${sizeMap[size]} text-white`} />
        </motion.div>
        {message && <p className="mt-4 text-gaming-300">{message}</p>}
      </div>
    );
  }
  
  if (variant === "dots") {
    return (
      <div className={containerClasses}>
        <div className="flex space-x-2">
          {[1, 2, 3].map((_, i) => (
            <motion.div
              key={i}
              animate={dotsAnimation}
              transition={{ 
                duration: 0.6,
                repeat: Infinity, 
                repeatType: 'loop',
                delay: i * 0.2 
              }}
              className="w-3 h-3 rounded-full bg-purple-500"
            />
          ))}
        </div>
        {message && <p className="mt-4 text-gaming-300">{message}</p>}
      </div>
    );
  }
  
  if (variant === "gaming") {
    return (
      <div className={containerClasses}>
        {renderGamingLoader()}
        {message && (
          <motion.p 
            className="mt-4 text-gaming-300 font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {message}
          </motion.p>
        )}
      </div>
    );
  }

  // Default or spinner
  return (
    <div className={containerClasses}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Loader className={`${sizeMap[size]} text-orange-500`} />
      </motion.div>
      {message && <p className="mt-4 text-gaming-300">{message}</p>}
    </div>
  );
};

export const ErrorFallback: React.FC<{
  error?: Error | null;
  resetErrorBoundary?: () => void;
  message?: string;
  className?: string;
}> = ({ error, resetErrorBoundary, message, className = "" }) => {
  return (
    <div className={`flex flex-col items-center justify-center h-full p-6 ${className}`}>
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center text-red-500 mb-4">
          <AlertCircle className="h-6 w-6 mr-2" />
          <h3 className="text-lg font-medium">Something went wrong</h3>
        </div>
        
        <p className="text-gaming-300 mb-4">
          {message || "There was an error loading this content."}
        </p>
        
        {error && process.env.NODE_ENV !== "production" && (
          <pre className="bg-gaming-900 p-3 rounded text-xs text-red-300 overflow-auto max-h-40 mb-4">
            {error.message}
          </pre>
        )}
        
        {resetErrorBoundary && (
          <button
            onClick={resetErrorBoundary}
            className="bg-gaming-800 hover:bg-gaming-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};
