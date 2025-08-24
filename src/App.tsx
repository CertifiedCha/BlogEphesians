import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BlogCard } from './components/BlogCard';
import { SpotlightSection } from './components/SpotlightSection';
import { AuthModal } from './components/AuthModal';
import { BlogEditor } from './components/BlogEditor';
import { BlogDetailView } from './components/BlogDetailView';
import { MusicPlayer } from './components/MusicPlayer';
import { LoadingScreen } from './components/LoadingScreen';
import { Button } from './components/ui/button';
import { AuthProvider } from './contexts/AuthContext';
import { BlogProvider, useBlog, Blog } from './contexts/BlogContext';
import { Toaster } from './components/ui/sonner';
import { motion, AnimatePresence } from 'motion/react';

type ViewMode = 'home' | 'editor' | 'detail';

// Simple background components
const FloatingOrbs = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-64 h-64 rounded-full opacity-10"
        style={{
          background: `linear-gradient(135deg, ${
            ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][i]
          }, transparent)`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -100, 50, 0],
          scale: [1, 1.2, 0.8, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 20 + i * 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: i * 2,
        }}
      />
    ))}
  </div>
);

const ParticleField = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    {[...Array(50)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-primary/20 rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -window.innerHeight],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 10 + Math.random() * 10,
          repeat: Infinity,
          delay: Math.random() * 5,
          ease: "linear",
        }}
      />
    ))}
  </div>
);

const AppContent: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('theme') === 'dark'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authType, setAuthType] = useState<'login' | 'signup'>('login');
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    blogs,
    toggleLikeBlog,
    searchBlogs,
    getSortedBlogs,
    refreshBlogs,
  } = useBlog();

  // Show loading screen initially, then hide after blogs are loaded
  useEffect(() => {
    if (blogs.length > 0) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000); // Show dolphin loading for 1 second
      return () => clearTimeout(timer);
    }
  }, [blogs.length]);

  // Load theme preference on mount
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Filter and sort blogs - immediate processing
  const filteredBlogs = useMemo(() => {
    let result = [...blogs];

    if (searchQuery) {
      result = searchBlogs(searchQuery);
    }

    if (selectedCategory) {
      result = result.filter(blog => blog.category === selectedCategory);
    }

    if (selectedTag) {
      result = result.filter(blog => blog.tags && blog.tags.includes(selectedTag));
    }

    return getSortedBlogs(result);
  }, [blogs, searchQuery, selectedCategory, selectedTag, searchBlogs, getSortedBlogs]);

  // Use ALL blogs for spotlight
  const spotlightBlogs = useMemo(() => {
    return getSortedBlogs(blogs).slice(0, 6);
  }, [blogs, getSortedBlogs]);

  const handleShowAuth = (type: 'login' | 'signup') => {
    setAuthType(type);
    setShowAuth(true);
  };

  const handleBlogClick = (blog: Blog) => {
    setSelectedBlog(blog);
    setCurrentView('detail');
  };

  const handleLikeBlog = (blogId: string) => {
    toggleLikeBlog(blogId);
  };

  const handleShowEditor = () => {
    setCurrentView('editor');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedBlog(null);
    refreshBlogs();
  };

  const toggleAuthType = () => {
    setAuthType(authType === 'login' ? 'signup' : 'login');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedTag(null);
  };

  // Show loading screen
  if (isLoading) {
    return <LoadingScreen message="Welcome to BlogVerse" size="full" />;
  }

  // Render different views based on current state
  if (currentView === 'editor') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <BlogEditor onBack={handleBackToHome} />
        <MusicPlayer />
      </motion.div>
    );
  }

  if (currentView === 'detail' && selectedBlog) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <BlogDetailView blog={selectedBlog} onBack={handleBackToHome} />
        <MusicPlayer />
      </motion.div>
    );
  }

  // Main blog view with new layout
  return (
    <motion.div 
      className="min-h-screen bg-background relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background Elements */}
      <FloatingOrbs />
      <ParticleField />
      
      {/* Animated gradient overlay */}
      <motion.div
        className="fixed inset-0 bg-gradient-to-br from-background/50 via-transparent to-background/30 pointer-events-none z-0"
        animate={{
          background: isDarkMode 
            ? [
                "radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
                "radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)",
                "radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)"
              ]
            : [
                "radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)",
                "radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)",
                "radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)"
              ]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10">
        {/* Header */}
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          <Header
            onSearch={setSearchQuery}
            onToggleTheme={toggleTheme}
            isDarkMode={isDarkMode}
            onShowAuth={handleShowAuth}
            onShowCreateBlog={handleShowEditor}
          />
        </motion.div>

        <div className="flex relative">
          {/* Left Sidebar */}
          <Sidebar
            selectedCategory={selectedCategory}
            selectedTag={selectedTag}
            onCategorySelect={setSelectedCategory}
            onTagSelect={setSelectedTag}
          />

          {/* Main content - now centered between sidebars */}
          <main className="flex-1 p-8 max-w-none">
            <div className="max-w-4xl mx-auto">
              {/* Spotlight section */}
              {spotlightBlogs.length > 0 && (
                <motion.div
                  initial={{ y: 100, opacity: 0, scale: 0.9 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 1, delay: 0.4, type: "spring" }}
                >
                  <SpotlightSection
                    blogs={spotlightBlogs}
                    onBlogClick={handleBlogClick}
                  />
                </motion.div>
              )}

              {/* Main blog grid section */}
              <motion.section
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <motion.div 
                  className="flex items-center justify-between mb-6"
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <div>
                    <motion.h2 
                      className="text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent"
                      animate={{ 
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                      }}
                      transition={{ duration: 5, repeat: Infinity }}
                    >
                      {searchQuery && `Search results for "${searchQuery}"`}
                      {selectedCategory && `${selectedCategory} Posts`}
                      {selectedTag && `Posts tagged with #${selectedTag}`}
                      {!searchQuery && !selectedCategory && !selectedTag && 'Latest Posts'}
                    </motion.h2>
                    <motion.p 
                      className="text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                    >
                      {filteredBlogs.length} post{filteredBlogs.length !== 1 ? 's' : ''} found
                    </motion.p>
                  </div>
                  
                  {/* Clear filters button */}
                  {(searchQuery || selectedCategory || selectedTag) && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", delay: 0.9 }}
                    >
                      <Button
                        variant="outline"
                        onClick={clearFilters}
                        className="playful-secondary relative overflow-hidden group"
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"
                          initial={{ x: '-100%' }}
                          whileHover={{ x: '100%' }}
                          transition={{ duration: 0.6 }}
                        />
                        <span className="relative z-10">Clear Filters</span>
                      </Button>
                    </motion.div>
                  )}
                </motion.div>

                {filteredBlogs.length > 0 ? (
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: {
                          delayChildren: 0.1,
                          staggerChildren: 0.1
                        }
                      }
                    }}
                  >
                    {filteredBlogs.map((blog, index) => (
                      <motion.div
                        key={blog.id}
                        variants={{
                          hidden: { y: 50, opacity: 0, scale: 0.9 },
                          visible: { 
                            y: 0, 
                            opacity: 1, 
                            scale: 1,
                            transition: {
                              type: "spring",
                              duration: 0.6
                            }
                          }
                        }}
                        whileHover={{ 
                          y: -8,
                          scale: 1.02,
                          transition: { duration: 0.2 }
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <BlogCard
                          blog={blog}
                          onLike={handleLikeBlog}
                          onClick={handleBlogClick}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div 
                    className="text-center py-12"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    <motion.div 
                      className="max-w-md mx-auto"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.6 }}
                    >
                      <motion.h3 
                        className="text-lg font-semibold mb-2"
                        animate={{ 
                          scale: [1, 1.05, 1],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        No posts found
                      </motion.h3>
                      <p className="text-muted-foreground mb-6">
                        {searchQuery || selectedCategory || selectedTag
                          ? "Try adjusting your search terms or filters to find what you're looking for."
                          : "No blog posts have been created yet. Be the first to share your thoughts!"
                        }
                      </p>
                      <motion.div 
                        className="flex gap-3 justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                      >
                        {(searchQuery || selectedCategory || selectedTag) && (
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              onClick={clearFilters}
                              variant="outline"
                              className="playful-secondary"
                            >
                              Clear all filters
                            </Button>
                          </motion.div>
                        )}
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            onClick={handleShowEditor}
                            className="playful-button relative overflow-hidden"
                          >
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                              animate={{ x: ['0%', '100%'] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                            <span className="relative z-10">Create First Post</span>
                          </Button>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                )}
              </motion.section>
            </div>
          </main>
        </div>
      </div>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuth && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AuthModal
              isOpen={showAuth}
              onClose={() => setShowAuth(false)}
              type={authType}
              onToggleType={toggleAuthType}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Music Player */}
      <MusicPlayer />

      {/* Toast Notifications */}
      <Toaster />
    </motion.div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BlogProvider>
        <AppContent />
      </BlogProvider>
    </AuthProvider>
  );
}