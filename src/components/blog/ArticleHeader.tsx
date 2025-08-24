import React from 'react';
import { Calendar, Clock, Eye, MessageCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Blog } from '../../contexts/BlogContext';
import { motion } from 'motion/react';
import { getCategoryGradient, formatDateWithTime } from '../../utils/helpers';

interface ArticleHeaderProps {
  blog: Blog;
}

export const ArticleHeader: React.FC<ArticleHeaderProps> = ({ blog }) => {
  return (
    <div className="space-y-8">
      {/* Category and Meta */}
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Badge 
            className={`
              bg-gradient-to-r ${getCategoryGradient(blog.category)} 
              text-white px-4 py-2 text-sm font-medium shadow-lg
            `}
          >
            {blog.category}
          </Badge>
        </motion.div>

        <motion.h1
          className="text-4xl md:text-5xl font-bold leading-tight bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {blog.title}
        </motion.h1>

        <motion.p
          className="text-xl text-muted-foreground leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          {blog.excerpt}
        </motion.p>
      </div>

      {/* Author and Meta Info */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-6 border-y border-border/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <Avatar className="w-12 h-12 border-2 border-primary/20">
            <AvatarImage src={blog.authorAvatar} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white">
              {blog.authorName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">{blog.authorName}</p>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDateWithTime(blog.createdAt)}
              </span>
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {blog.readTime} min read
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Eye className="w-4 h-4" />
            <span>{blog.views.toLocaleString()} views</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageCircle className="w-4 h-4" />
            <span>{blog.comments.length} comments</span>
          </div>
        </div>
      </motion.div>

      {/* Tags */}
      <motion.div
        className="flex flex-wrap gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
      >
        {blog.tags.map((tag, index) => (
          <motion.div
            key={tag}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 + index * 0.1, duration: 0.3 }}
          >
            <Badge variant="outline" className="hover:bg-primary/10 hover:border-primary/30 transition-colors">
              #{tag}
            </Badge>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};