import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bookmark, Heart, Share2 } from 'lucide-react';
import { Button } from './ui/button';
import { ArticleHeader } from './blog/ArticleHeader';
import { EngagementActions } from './blog/EngagementActions';
import { CommentsSection } from './blog/CommentsSection';
import { Blog, useBlog } from '../contexts/BlogContext';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { shareContent } from '../utils/helpers';

interface BlogDetailViewProps {
  blog: Blog;
  onBack: () => void;
}

export const BlogDetailView: React.FC<BlogDetailViewProps> = ({ blog, onBack }) => {
  const [showComments, setShowComments] = useState(true);
  const { toggleLikeBlog, addComment, incrementViews } = useBlog();
  const { user } = useAuth();

  const isLiked = user ? blog.likes.includes(user.id) : false;

  // Increment views when component mounts
  useEffect(() => {
    incrementViews(blog.id);
  }, [blog.id, incrementViews]);

  const handleLike = () => {
    toggleLikeBlog(blog.id);
    if (!isLiked) {
      toast.success('Added to favorites! ❤️');
    }
  };

  const handleShare = async () => {
    const shared = await shareContent(blog.title, blog.excerpt, window.location.href);
    if (shared) {
      toast.success('Shared successfully! 📤');
    } else {
      toast.success('Link copied to clipboard! 📋');
    }
  };

  const handleAddComment = (blogId: string, content: string, isAnonymous = false) => {
    addComment(blogId, content, isAnonymous);
  };

  return (
    <motion.div
      className="min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.header
        className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button variant="ghost" onClick={onBack} className="rounded-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Posts
              </Button>
            </motion.div>

            <div className="flex items-center space-x-2">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="sm" onClick={handleShare}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="sm">
                  <Bookmark className="w-4 h-4" />
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={isLiked ? 'text-red-500' : ''}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500' : ''}`} />
                  <span className="ml-1">{blog.likes.length}</span>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Article */}
          <motion.article
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <ArticleHeader blog={blog} />

            {/* Content */}
            <motion.div
              className="prose prose-lg max-w-none mt-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <div dangerouslySetInnerHTML={{ __html: blog.content }} />
            </motion.div>

            {/* Engagement Actions */}
            <EngagementActions
              blog={blog}
              isLiked={isLiked}
              showComments={showComments}
              onLike={handleLike}
              onToggleComments={() => setShowComments(!showComments)}
            />
          </motion.article>

          {/* Comments Section */}
          <CommentsSection
            blog={blog}
            isVisible={showComments}
            onAddComment={handleAddComment}
          />
        </div>
      </div>
    </motion.div>
  );
};