import React, { useState } from 'react';
import { MessageCircle, Send, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Blog } from '../../contexts/BlogContext';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { formatDateWithTime } from '../../utils/helpers';

interface CommentsSectionProps {
  blog: Blog;
  isVisible: boolean;
  onAddComment: (blogId: string, content: string, isAnonymous?: boolean) => void;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  blog,
  isVisible,
  onAddComment,
}) => {
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim()) return;

    if (!user && !isAnonymous) {
      toast.error('Please sign in to comment or choose to comment anonymously');
      return;
    }

    setIsSubmitting(true);
    
    try {
      onAddComment(blog.id, comment.trim(), isAnonymous);
      setComment('');
      toast.success('Comment added successfully! 💬');
    } catch (error) {
      toast.error('Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.section
          className="mt-12 space-y-6"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-primary" />
                Comments ({blog.comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Comment Form */}
              <form onSubmit={handleCommentSubmit} className="space-y-4">
                <Textarea
                  placeholder={user ? "Share your thoughts..." : "Sign in to comment or comment anonymously..."}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {!user && (
                      <label className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          className="rounded"
                        />
                        <span>Comment anonymously</span>
                      </label>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!user && !isAnonymous && (
                      <p className="text-sm text-muted-foreground">
                        Please <Button variant="link" className="p-0 h-auto">sign in</Button> to comment
                      </p>
                    )}
                    <Button
                      type="submit"
                      disabled={!comment.trim() || isSubmitting || (!user && !isAnonymous)}
                      className="playful-button"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isSubmitting ? 'Posting...' : 'Post Comment'}
                    </Button>
                  </div>
                </div>
              </form>

              <Separator />

              {/* Comments List */}
              <div className="space-y-4">
                {blog.comments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No comments yet. Be the first to share your thoughts!</p>
                  </div>
                ) : (
                  blog.comments
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((comment, index) => (
                      <motion.div
                        key={comment.id}
                        className="flex space-x-3 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-300"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                      >
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={comment.authorAvatar} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white text-xs">
                            {comment.isAnonymous ? '?' : comment.authorName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">
                              {comment.isAnonymous ? 'Anonymous' : comment.authorName}
                            </span>
                            {comment.isAnonymous && (
                              <Badge variant="secondary" className="text-xs">
                                Anonymous
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDateWithTime(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{comment.content}</p>
                        </div>
                      </motion.div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.section>
      )}
    </AnimatePresence>
  );
};