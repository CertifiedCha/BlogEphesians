import React from 'react';
import { Heart, Share2, MessageCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Blog } from '../../contexts/BlogContext';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { shareContent } from '../../utils/helpers';

interface EngagementActionsProps {
  blog: Blog;
  isLiked: boolean;
  showComments: boolean;
  onLike: () => void;
  onToggleComments: () => void;
}

export const EngagementActions: React.FC<EngagementActionsProps> = ({
  blog,
  isLiked,
  showComments,
  onLike,
  onToggleComments,
}) => {
  const handleShare = async () => {
    const shared = await shareContent(blog.title, blog.excerpt, window.location.href);
    if (shared) {
      toast.success('Shared successfully! 📤');
    } else {
      toast.success('Link copied to clipboard! 📋');
    }
  };

  return (
    <motion.div
      className="flex items-center justify-center space-x-4 py-8 border-y border-border/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.6 }}
    >
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <Button
          onClick={onLike}
          variant={isLiked ? "default" : "outline"}
          className={`
            group transition-all duration-300
            ${isLiked 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'hover:bg-red-50 hover:text-red-500 hover:border-red-200'
            }
          `}
        >
          <Heart 
            className={`w-4 h-4 mr-2 transition-all duration-300 ${
              isLiked ? 'fill-white' : 'group-hover:fill-red-500'
            }`} 
          />
          {isLiked ? 'Liked' : 'Like'} ({blog.likes.length})
        </Button>
      </motion.div>

      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <Button
          onClick={handleShare}
          variant="outline"
          className="hover:bg-blue-50 hover:text-blue-500 hover:border-blue-200 transition-all duration-300"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </motion.div>

      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <Button
          onClick={onToggleComments}
          variant="outline"
          className={`
            transition-all duration-300
            ${showComments 
              ? 'bg-green-50 text-green-500 border-green-200' 
              : 'hover:bg-green-50 hover:text-green-500 hover:border-green-200'
            }
          `}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Comments ({blog.comments.length})
        </Button>
      </motion.div>
    </motion.div>
  );
};