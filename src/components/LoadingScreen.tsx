import React from 'react';
import { motion } from 'motion/react';

interface LoadingScreenProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading...', 
  size = 'md' 
}) => {
  const getDolphinSize = () => {
    switch (size) {
      case 'sm': return 'w-8 h-8';
      case 'md': return 'w-16 h-16';
      case 'lg': return 'w-24 h-24';
      case 'full': return 'w-32 h-32';
      default: return 'w-16 h-16';
    }
  };

  const getContainerClasses = () => {
    if (size === 'full') {
      return 'fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center';
    }
    return 'flex items-center justify-center p-8';
  };

  return (
    <div className={getContainerClasses()}>
      <div className="flex flex-col items-center space-y-4">
        {/* Swimming Dolphin Animation */}
        <div className="relative">
          {/* Ocean waves background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-blue-500/30 to-blue-600/20 rounded-full blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Main dolphin container */}
          <motion.div
            className={`relative ${getDolphinSize()} flex items-center justify-center`}
            animate={{
              y: [0, -8, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {/* Dolphin SVG */}
            <motion.svg
              viewBox="0 0 100 100"
              className="w-full h-full text-blue-500"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            >
              {/* Dolphin body */}
              <motion.path
                d="M20,50 Q30,30 50,35 Q70,30 80,50 Q75,70 50,65 Q30,70 20,50 Z"
                fill="currentColor"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
              
              {/* Dolphin fin */}
              <motion.path
                d="M45,35 Q40,25 35,30 Q40,40 45,35 Z"
                fill="currentColor"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              
              {/* Dolphin tail */}
              <motion.path
                d="M75,45 Q85,35 90,45 Q85,55 75,55 Z"
                fill="currentColor"
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  transformOrigin: "75px 50px"
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              
              {/* Dolphin eye */}
              <motion.circle
                cx="40"
                cy="45"
                r="3"
                fill="white"
                animate={{ scale: [1, 0.8, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <circle cx="41" cy="44" r="1.5" fill="currentColor" />
            </motion.svg>
          </motion.div>

          {/* Water bubbles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-blue-400/40 rounded-full"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
              }}
              animate={{
                y: [0, -20, -40],
                opacity: [0, 0.7, 0],
                scale: [0.5, 1, 1.5]
              }}
              transition={{
                duration: 2 + Math.random(),
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeOut"
              }}
            />
          ))}
        </div>

        {/* Loading message */}
        <motion.div
          className="text-center space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.p
            className="text-foreground font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {message}
          </motion.p>
          
          {/* Animated dots */}
          <div className="flex justify-center space-x-1">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-blue-500 rounded-full"
                animate={{
                  scale: [0.8, 1.2, 0.8],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Ocean floor decoration */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600/20 via-blue-500/30 to-blue-600/20 rounded-full blur-sm"
          animate={{
            scaleX: [0.8, 1.2, 0.8],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
    </div>
  );
};

// Inline loading dolphin for smaller spaces
export const DolphinSpinner: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <motion.div
    className="inline-block"
    style={{ width: size, height: size }}
    animate={{ rotate: 360 }}
    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
  >
    <svg viewBox="0 0 24 24" className="w-full h-full text-blue-500">
      <path
        d="M6,12 Q8,8 12,9 Q16,8 18,12 Q17,16 12,15 Q8,16 6,12 Z"
        fill="currentColor"
      />
      <path
        d="M10,9 Q8,6 7,8 Q8,11 10,9 Z"
        fill="currentColor"
      />
      <circle cx="9" cy="11" r="1" fill="white" />
    </svg>
  </motion.div>
);