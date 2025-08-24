import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Clock, Eye, Heart, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Blog } from '../contexts/BlogContext';
import { motion, AnimatePresence } from 'motion/react';
import { getCategoryGradient, formatDate, stripHtmlTags } from '../utils/helpers';

interface SpotlightSectionProps {
  blogs: Blog[];
  onBlogClick: (blog: Blog) => void;
}

export const SpotlightSection: React.FC<SpotlightSectionProps> = ({
  blogs,
  onBlogClick,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  // Auto-advance every 10 seconds
  useEffect(() => {
    if (!isAutoPlaying || blogs.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % blogs.length);
      setProgress(0);
    }, 10000);

    return () => clearInterval(interval);
  }, [blogs.length, isAutoPlaying]);

  // Progress bar animation
  useEffect(() => {
    if (!isAutoPlaying || blogs.length <= 1) return;

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 0;
        return prev + 1;
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, [currentIndex, isAutoPlaying, blogs.length]);

  const handleSlideChange = (newIndex: number) => {
    setCurrentIndex(newIndex);
    setProgress(0);
  };

  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? blogs.length - 1 : currentIndex - 1;
    handleSlideChange(newIndex);
  };

  const goToNext = () => {
    const newIndex = (currentIndex + 1) % blogs.length;
    handleSlideChange(newIndex);
  };

  if (blogs.length === 0) return null;

  const currentBlog = blogs[currentIndex];
  const summary = stripHtmlTags(currentBlog.content).substring(0, 180) + '...';

  return (
    <motion.section
      className="relative mb-16 rounded-3xl overflow-hidden shadow-2xl"
      initial={{ opacity: 0, y: 100, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1.2, type: "spring", bounce: 0.3 }}
      style={{ height: '500px' }}
    >
      {/* Wavy Background with Dolphins */}
      <div className="absolute inset-0">
        {/* Base ocean gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700" />
        
        {/* Animated waves */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(0deg, rgba(59,130,246,0.8) 0%, transparent 50%),
              repeating-linear-gradient(
                90deg,
                rgba(255,255,255,0.1) 0px,
                rgba(255,255,255,0.3) 50px,
                rgba(255,255,255,0.1) 100px
              )
            `
          }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 0%']
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Wave SVG overlays */}
        <motion.div
          className="absolute bottom-0 left-0 w-full"
          animate={{
            x: [0, -100, 0]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <svg viewBox="0 0 1200 120" className="w-full h-24 opacity-30">
            <path 
              d="M0,60 C300,120 600,0 900,60 C1050,90 1200,30 1200,60 L1200,120 L0,120 Z" 
              fill="rgba(255,255,255,0.2)"
            />
          </svg>
        </motion.div>

        <motion.div
          className="absolute bottom-0 left-0 w-full"
          animate={{
            x: [0, 100, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        >
          <svg viewBox="0 0 1200 100" className="w-full h-20 opacity-40">
            <path 
              d="M0,40 C400,80 800,0 1200,40 L1200,100 L0,100 Z" 
              fill="rgba(255,255,255,0.3)"
            />
          </svg>
        </motion.div>

        {/* Animated dolphins */}
        <motion.div
          className="absolute top-1/4 left-10"
          animate={{
            x: [0, 50, 0],
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="text-4xl opacity-60">🐬</div>
        </motion.div>

        <motion.div
          className="absolute top-1/2 right-20"
          animate={{
            x: [0, -30, 0],
            y: [0, 15, 0],
            rotate: [0, -3, 3, 0]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        >
          <div className="text-3xl opacity-50">🐬</div>
        </motion.div>

        <motion.div
          className="absolute bottom-1/3 left-1/3"
          animate={{
            x: [0, 40, 0],
            y: [0, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        >
          <div className="text-2xl opacity-40">🐬</div>
        </motion.div>

        {/* Floating bubbles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, -200],
              opacity: [0.3, 0.7, 0],
              scale: [0.5, 1, 1.5]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeOut"
            }}
          />
        ))}

        {/* Coral and seaweed */}
        <motion.div
          className="absolute bottom-0 left-8"
          animate={{
            rotate: [0, 2, -2, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="text-3xl opacity-40">🌿</div>
        </motion.div>

        <motion.div
          className="absolute bottom-0 right-12"
          animate={{
            rotate: [0, -3, 3, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        >
          <div className="text-4xl opacity-50">🪸</div>
        </motion.div>
      </div>

      {/* Content overlay */}
      <div className="relative z-10 h-full flex items-center bg-black/20">
        <div className="container mx-auto px-8">
          <div className="max-w-4xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 50, x: 100 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, y: -50, x: -100 }}
                transition={{ 
                  duration: 0.8, 
                  type: "spring",
                  bounce: 0.2
                }}
                className="space-y-6"
              >
                {/* Category Badge with sparkle */}
                <motion.div
                  className="flex items-center space-x-2"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  >
                    <Star className="w-5 h-5 text-yellow-300" />
                  </motion.div>
                  <Badge 
                    className={`
                      bg-gradient-to-r ${getCategoryGradient(currentBlog.category)} 
                      text-white px-4 py-2 text-sm font-medium shadow-lg backdrop-blur-sm
                      hover:scale-110 transition-transform duration-300
                    `}
                  >
                    {currentBlog.category}
                  </Badge>
                </motion.div>

                {/* Title with wave effect */}
                <motion.h1
                  className="text-4xl md:text-6xl font-bold text-white leading-tight"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  style={{
                    textShadow: '0 4px 20px rgba(0,0,0,0.7), 0 0 40px rgba(255,255,255,0.2)'
                  }}
                >
                  <motion.span
                    animate={{
                      textShadow: [
                        '0 4px 20px rgba(0,0,0,0.7)',
                        '0 4px 30px rgba(59,130,246,0.5)',
                        '0 4px 20px rgba(0,0,0,0.7)'
                      ]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    {currentBlog.title}
                  </motion.span>
                </motion.h1>

                {/* Summary with wave animation */}
                <motion.p
                  className="text-xl md:text-2xl text-white/95 leading-relaxed max-w-3xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
                >
                  <motion.span
                    animate={{
                      y: [0, -2, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    {summary}
                  </motion.span>
                </motion.p>

                {/* Author and meta info with floating effect */}
                <motion.div
                  className="flex flex-wrap items-center gap-6 text-white/90"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                >
                  <motion.div 
                    className="flex items-center space-x-2"
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 0 }}
                  >
                    <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center border-2 border-white/20">
                      <span className="text-sm font-bold">
                        {currentBlog.authorName.charAt(0)}
                      </span>
                    </div>
                    <span className="font-medium">{currentBlog.authorName}</span>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-center space-x-1"
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                  >
                    <Clock className="w-4 h-4" />
                    <span>{currentBlog.readTime} min read</span>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-center space-x-1"
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                  >
                    <Eye className="w-4 h-4" />
                    <span>{currentBlog.views.toLocaleString()}</span>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-center space-x-1"
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                  >
                    <Heart className="w-4 h-4" />
                    <span>{currentBlog.likes.length}</span>
                  </motion.div>
                </motion.div>

                {/* CTA Button with ripple effect */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.8 }}
                >
                  <motion.div
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => onBlogClick(currentBlog)}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-2 border-white/30 hover:border-white/50 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 relative overflow-hidden group"
                    >
                      <motion.div
                        className="absolute inset-0 bg-white/10"
                        animate={{
                          scale: [0, 2],
                          opacity: [0.5, 0]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeOut"
                        }}
                      />
                      <motion.div
                        className="flex items-center space-x-2 relative z-10"
                        whileHover={{ x: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Play className="w-5 h-5" />
                        <span>Dive Into Story</span>
                      </motion.div>
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Navigation Controls with ocean theme */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex items-center space-x-4">
          <motion.div
            whileHover={{ scale: 1.1, x: -2 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrevious}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/30"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </motion.div>

          {/* Dots with wave effect */}
          <div className="flex space-x-2">
            {blogs.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => handleSlideChange(index)}
                className={`relative w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-white scale-125' 
                    : 'bg-white/40 hover:bg-white/60'
                }`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                animate={index === currentIndex ? {
                  y: [0, -3, 0]
                } : {}}
                transition={{
                  y: { duration: 1, repeat: Infinity }
                }}
              >
                {index === currentIndex && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-white"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          <motion.div
            whileHover={{ scale: 1.1, x: 2 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNext}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/30"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </motion.div>

          {/* Auto-play toggle */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/30"
            >
              <motion.div
                animate={isAutoPlaying ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 2, repeat: isAutoPlaying ? Infinity : 0, ease: "linear" }}
              >
                <Play className={`w-4 h-4 ${!isAutoPlaying ? 'opacity-50' : ''}`} />
              </motion.div>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Progress Wave */}
      {isAutoPlaying && blogs.length > 1 && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-white/50 to-white/80"
          style={{ width: `${progress}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      )}
    </motion.section>
  );
};