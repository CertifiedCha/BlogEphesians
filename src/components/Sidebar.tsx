import React from 'react';
import { Home, BookOpen, Palette, Code, Plane, Lightbulb, Heart, TrendingUp, Clock, Hash } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { useBlog } from '../contexts/BlogContext';
import { motion } from 'motion/react';

interface SidebarProps {
  selectedCategory: string | null;
  selectedTag: string | null;
  onCategorySelect: (category: string | null) => void;
  onTagSelect: (tag: string | null) => void;
}

const categories = [
  { name: 'Programming', icon: Code, color: 'bg-blue-500' },
  { name: 'Design', icon: Palette, color: 'bg-purple-500' },
  { name: 'Technology', icon: Lightbulb, color: 'bg-yellow-500' },
  { name: 'Travel', icon: Plane, color: 'bg-green-500' },
  { name: 'Lifestyle', icon: Heart, color: 'bg-pink-500' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  selectedCategory,
  selectedTag,
  onCategorySelect,
  onTagSelect,
}) => {
  const { blogs, getAllCategories, getAllTags, getSortedBlogs } = useBlog();

  const availableCategories = getAllCategories();
  const availableTags = getAllTags();
  const recentBlogs = getSortedBlogs().slice(0, 5);

  const getCategoryIcon = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.icon || BookOpen;
  };

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.color || 'bg-gray-500';
  };

  return (
    <div className="flex">
      {/* Main Sidebar - Left */}
      <motion.aside 
        className="w-64 h-screen sticky top-16 bg-sidebar border-r border-sidebar-border overflow-hidden"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
      >
        <div className="p-6 h-full flex flex-col">
          {/* Navigation */}
          <div className="space-y-2 mb-6">
            <motion.div
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant={!selectedCategory && !selectedTag ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  onCategorySelect(null);
                  onTagSelect(null);
                }}
              >
                <Home className="mr-3 h-4 w-4" />
                All Posts
                <Badge variant="secondary" className="ml-auto">
                  {blogs.length}
                </Badge>
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button variant="ghost" className="w-full justify-start">
                <TrendingUp className="mr-3 h-4 w-4" />
                Trending
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button variant="ghost" className="w-full justify-start">
                <Clock className="mr-3 h-4 w-4" />
                Recent
              </Button>
            </motion.div>
          </div>

          <Separator className="my-4" />

          {/* Categories */}
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-medium text-sidebar-foreground/70 uppercase tracking-wider">
              Categories
            </h3>
            <div className="space-y-1">
              {availableCategories.map((category) => {
                const IconComponent = getCategoryIcon(category);
                const categoryBlogs = blogs.filter(blog => blog.category === category);
                
                return (
                  <motion.div
                    key={category}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant={selectedCategory === category ? "secondary" : "ghost"}
                      className="w-full justify-start text-left"
                      onClick={() => onCategorySelect(category)}
                    >
                      <div className={`w-2 h-2 rounded-full mr-3 ${getCategoryColor(category)}`} />
                      <IconComponent className="mr-2 h-4 w-4" />
                      {category}
                      <Badge variant="secondary" className="ml-auto">
                        {categoryBlogs.length}
                      </Badge>
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Recent Posts Preview */}
          <div className="flex-1 overflow-hidden">
            <h3 className="text-sm font-medium text-sidebar-foreground/70 uppercase tracking-wider mb-3">
              Recent Posts
            </h3>
            <ScrollArea className="h-full">
              <div className="space-y-3">
                {recentBlogs.map((blog) => (
                  <motion.div
                    key={blog.id}
                    className="group cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="p-3 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors">
                      <h4 className="text-sm font-medium line-clamp-2 group-hover:text-sidebar-primary transition-colors">
                        {blog.title}
                      </h4>
                      <p className="text-xs text-sidebar-foreground/60 mt-1">
                        {blog.authorName} • {blog.readTime} min read
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="outline" className="text-xs">
                          {blog.category}
                        </Badge>
                        <span className="text-xs text-sidebar-foreground/50">
                          {blog.likes.length} ❤️
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </motion.aside>

      {/* Tags Filter Panel - Right */}
      <motion.div 
        className="w-72 h-screen sticky top-16 bg-background border-l border-border overflow-hidden ml-auto"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, type: "spring", delay: 0.2 }}
      >
        <div className="p-6 h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Filters & Tags</h3>
            {(selectedCategory || selectedTag) && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onCategorySelect(null);
                    onTagSelect(null);
                  }}
                >
                  Clear All
                </Button>
              </motion.div>
            )}
          </div>

          {/* Active Filters */}
          {(selectedCategory || selectedTag) && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Active Filters</h4>
              <div className="flex flex-wrap gap-2">
                {selectedCategory && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Badge 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={() => onCategorySelect(null)}
                    >
                      {selectedCategory} ×
                    </Badge>
                  </motion.div>
                )}
                {selectedTag && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Badge 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={() => onTagSelect(null)}
                    >
                      #{selectedTag} ×
                    </Badge>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          <Separator className="my-4" />

          {/* Tags Cloud */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Hash className="w-4 h-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Popular Tags</h4>
            </div>
            
            {/* Custom Scrollbar for Tags */}
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div 
                className="space-y-2 pr-3"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgb(59 130 246 / 0.3) transparent'
                }}
              >
                <style jsx>{`
                  .space-y-2::-webkit-scrollbar {
                    width: 6px;
                  }
                  .space-y-2::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  .space-y-2::-webkit-scrollbar-thumb {
                    background: linear-gradient(to bottom, rgb(59 130 246 / 0.4), rgb(139 92 246 / 0.4));
                    border-radius: 3px;
                  }
                  .space-y-2::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(to bottom, rgb(59 130 246 / 0.6), rgb(139 92 246 / 0.6));
                  }
                `}</style>
                
                {availableTags.map((tag, index) => {
                  const tagBlogs = blogs.filter(blog => blog.tags && blog.tags.includes(tag));
                  return (
                    <motion.div
                      key={tag}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.05, x: 4 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant={selectedTag === tag ? "default" : "outline"}
                        size="sm"
                        className="w-full justify-between group hover:shadow-md transition-all duration-200"
                        onClick={() => onTagSelect(tag)}
                      >
                        <span className="flex items-center">
                          <Hash className="w-3 h-3 mr-1 opacity-60" />
                          {tag}
                        </span>
                        <Badge 
                          variant="secondary" 
                          className="group-hover:scale-110 transition-transform"
                        >
                          {tagBlogs.length}
                        </Badge>
                      </Button>
                    </motion.div>
                  );
                })}
                
                {availableTags.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Hash className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No tags available yet</p>
                    <p className="text-xs">Tags will appear as you create posts</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </motion.div>
    </div>
  );
};