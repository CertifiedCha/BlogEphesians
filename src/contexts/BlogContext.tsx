import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { saveToStorage, loadFromStorage, removeFromStorage, cleanupStorage } from '../utils/storage';
import { toast } from 'sonner@2.0.3';

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: Date;
  isAnonymous?: boolean;
}

export interface Blog {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  category: string;
  tags: string[];
  likes: string[];
  views: number;
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
  isSpotlight?: boolean;
  readTime: number;
}

type SortBy = 'recent' | 'oldest' | 'likes' | 'views';
type SortOrder = 'asc' | 'desc';

interface BlogContextType {
  blogs: Blog[];
  sortBy: SortBy;
  sortOrder: SortOrder;
  setSortBy: (sort: SortBy) => void;
  setSortOrder: (order: SortOrder) => void;
  createBlog: (blogData: Omit<Blog, 'id' | 'authorId' | 'authorName' | 'authorAvatar' | 'likes' | 'views' | 'comments' | 'createdAt' | 'updatedAt' | 'readTime'>) => Promise<string>;
  updateBlog: (id: string, updates: Partial<Blog>) => void;
  deleteBlog: (id: string) => void;
  toggleLikeBlog: (id: string) => void;
  addComment: (blogId: string, content: string, isAnonymous?: boolean) => void;
  deleteComment: (blogId: string, commentId: string) => void;
  incrementViews: (id: string) => void;
  searchBlogs: (query: string) => Blog[];
  getBlogsByCategory: (category: string) => Blog[];
  getBlogsByTag: (tag: string) => Blog[];
  getBlogsByAuthor: (authorId: string) => Blog[];
  getSpotlightBlogs: () => Blog[];
  getSortedBlogs: (blogsToSort?: Blog[]) => Blog[];
  getAllCategories: () => string[];
  getAllTags: () => string[];
  refreshBlogs: () => void;
  getFullBlogContent: (blogId: string) => string;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

export const useBlog = (): BlogContextType => {
  const context = useContext(BlogContext);
  if (!context) {
    throw new Error('useBlog must be used within a BlogProvider');
  }
  return context;
};

interface BlogProviderProps {
  children: ReactNode;
}

// Comprehensive sample blog data for immediate display
const sampleBlogs: Blog[] = [
  {
    id: '1',
    title: 'The Future of Web Development: Trends to Watch in 2024',
    content: `<h2>Introduction</h2><p>Web development continues to evolve at a rapid pace, with new technologies and methodologies emerging constantly. As we progress through 2024, several key trends are shaping the future of how we build and interact with web applications.</p><h3>1. AI-Powered Development Tools</h3><p>Artificial Intelligence is revolutionizing the development process. From code completion to automated testing, AI tools are becoming indispensable for modern developers.</p><h3>2. WebAssembly (WASM) Adoption</h3><p>WebAssembly is gaining traction as a way to run high-performance applications in the browser. Languages like Rust, C++, and Go can now compile to WASM.</p>`,
    excerpt: 'Exploring the latest trends shaping web development in 2024, from AI-powered tools to WebAssembly and edge computing.',
    authorId: 'author1',
    authorName: 'Sarah Chen',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b23c?w=150&h=150&fit=crop&crop=face',
    category: 'Programming',
    tags: ['Web Development', 'AI', 'WebAssembly', 'Trends'],
    likes: ['user1', 'user2', 'user3'],
    views: 2547,
    comments: [],
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-01-15T10:30:00'),
    isSpotlight: true,
    readTime: 8,
  },
  {
    id: '2',
    title: 'Building Scalable Design Systems: A Complete Guide',
    content: `<h2>What is a Design System?</h2><p>A design system is a comprehensive set of standards intended to manage design at scale by reducing redundancy while creating a shared language and visual consistency.</p><h3>Key Components</h3><ul><li>Design Tokens</li><li>Component Library</li><li>Guidelines</li><li>Documentation</li></ul>`,
    excerpt: 'Learn how to create and maintain design systems that scale with your organization, ensuring consistency and efficiency.',
    authorId: 'author2',
    authorName: 'Marcus Johnson',
    authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    category: 'Design',
    tags: ['Design Systems', 'UI/UX', 'Figma', 'Components'],
    likes: ['user3', 'user4'],
    views: 1892,
    comments: [],
    createdAt: new Date('2024-01-12T14:20:00'),
    updatedAt: new Date('2024-01-12T14:20:00'),
    isSpotlight: true,
    readTime: 12,
  },
  {
    id: '3',
    title: 'The Rise of AI in Creative Industries',
    content: `<h2>AI Transforms Creative Work</h2><p>Artificial Intelligence is revolutionizing creative industries, from graphic design to music composition, offering new possibilities while raising important questions.</p><h3>AI in Visual Arts</h3><p>Tools like DALL-E, Midjourney, and Stable Diffusion have democratized digital art creation.</p>`,
    excerpt: 'Discover how AI is transforming creative industries and reshaping the way artists, designers, and creators work.',
    authorId: 'author3',
    authorName: 'Emma Thompson',
    authorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    category: 'Technology',
    tags: ['AI', 'Creativity', 'Art', 'Innovation'],
    likes: ['user1', 'user5'],
    views: 1654,
    comments: [],
    createdAt: new Date('2024-01-10T09:15:00'),
    updatedAt: new Date('2024-01-10T09:15:00'),
    isSpotlight: true,
    readTime: 6,
  },
  {
    id: '4',
    title: 'Sustainable Travel: Exploring the World Responsibly',
    content: `<h2>The Impact of Tourism</h2><p>Travel broadens perspectives but has environmental impact. Sustainable travel minimizes negative effects while maximizing positive contributions to local communities.</p>`,
    excerpt: 'Learn how to explore the world while minimizing your environmental impact and supporting local communities.',
    authorId: 'author4',
    authorName: 'David Kim',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    category: 'Travel',
    tags: ['Sustainability', 'Environment', 'Responsible Travel'],
    likes: [],
    views: 823,
    comments: [],
    createdAt: new Date('2024-01-08T16:45:00'),
    updatedAt: new Date('2024-01-08T16:45:00'),
    readTime: 10,
  },
  {
    id: '5',
    title: 'The Psychology of User Experience Design',
    content: `<h2>Understanding User Behavior</h2><p>Great UX design is about understanding how people think, feel, and behave when interacting with digital products. Psychology plays a crucial role.</p>`,
    excerpt: 'Explore the psychological principles behind great user experience design and learn how to create interfaces that users love.',
    authorId: 'author5',
    authorName: 'Lisa Wang',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    category: 'Design',
    tags: ['UX', 'Psychology', 'User Research', 'Interface Design'],
    likes: ['user2', 'user4', 'user6'],
    views: 1234,
    comments: [],
    createdAt: new Date('2024-01-05T11:20:00'),
    updatedAt: new Date('2024-01-05T11:20:00'),
    readTime: 7,
  }
];

const calculateReadTime = (content: string): number => {
  const wordsPerMinute = 200;
  const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
};

const fullContentStorage = new Map<string, string>();

export const BlogProvider: React.FC<BlogProviderProps> = ({ children }) => {
  // Initialize immediately with sample blogs - no empty state ever
  const [blogs, setBlogs] = useState<Blog[]>(sampleBlogs);
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const { user } = useAuth();

  // Synchronously load blogs on mount - no async delay
  useEffect(() => {
    const savedBlogs = loadFromStorage('blogverse_blogs', null);
    
    if (savedBlogs && Array.isArray(savedBlogs) && savedBlogs.length > 0) {
      try {
        const blogsWithDates = savedBlogs.map((blog: any) => ({
          ...blog,
          createdAt: new Date(blog.createdAt),
          updatedAt: new Date(blog.updatedAt),
          comments: (blog.comments || []).map((comment: any) => ({
            ...comment,
            createdAt: new Date(comment.createdAt)
          }))
        }));
        
        // Only replace if we have more blogs than sample data
        if (blogsWithDates.length >= sampleBlogs.length) {
          setBlogs(blogsWithDates);
        }
      } catch (error) {
        console.error('Error processing saved blogs:', error);
      }
    }
    
    // Always ensure we have at least sample data
    if (!savedBlogs) {
      saveToStorage('blogverse_blogs', sampleBlogs);
    }
  }, []); // Run only once on mount

  // Immediate save on changes (no debounce for immediate persistence)
  useEffect(() => {
    if (blogs.length > 0) {
      saveToStorage('blogverse_blogs', blogs);
    }
  }, [blogs]);

  const refreshBlogs = () => {
    // Force immediate re-render
    setBlogs(prevBlogs => [...prevBlogs]);
  };

  const getFullBlogContent = (blogId: string): string => {
    const fullContent = fullContentStorage.get(blogId);
    if (fullContent) return fullContent;
    
    const blog = blogs.find(b => b.id === blogId);
    return blog?.content || '';
  };

  const createBlog = async (blogData: Omit<Blog, 'id' | 'authorId' | 'authorName' | 'authorAvatar' | 'likes' | 'views' | 'comments' | 'createdAt' | 'updatedAt' | 'readTime'>): Promise<string> => {
    if (!user) {
      throw new Error('User must be logged in to create blog');
    }

    const blogId = `blog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store full content separately if large
    if (blogData.content.length > 1000) {
      fullContentStorage.set(blogId, blogData.content);
    }

    const newBlog: Blog = {
      ...blogData,
      id: blogId,
      authorId: user.id,
      authorName: user.username,
      authorAvatar: user.avatar,
      likes: [],
      views: Math.floor(Math.random() * 100) + 1,
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      readTime: calculateReadTime(blogData.content),
    };

    // Immediate state update - no delays
    setBlogs(prev => [newBlog, ...prev]);
    
    toast.success('Blog post published successfully! 🎉');
    return blogId;
  };

  const updateBlog = (id: string, updates: Partial<Blog>) => {
    setBlogs(prev => prev.map(blog => 
      blog.id === id 
        ? { 
            ...blog, 
            ...updates, 
            updatedAt: new Date(),
            readTime: updates.content ? calculateReadTime(updates.content) : blog.readTime
          }
        : blog
    ));
  };

  const deleteBlog = (id: string) => {
    setBlogs(prev => prev.filter(blog => blog.id !== id));
    fullContentStorage.delete(id);
  };

  const toggleLikeBlog = (id: string) => {
    if (!user) {
      toast.error('Please log in to like posts');
      return;
    }

    setBlogs(prev => prev.map(blog => {
      if (blog.id === id) {
        const hasLiked = blog.likes.includes(user.id);
        const newLikes = hasLiked
          ? blog.likes.filter(userId => userId !== user.id)
          : [...blog.likes, user.id];
        
        toast.success(hasLiked ? 'Removed like' : 'Post liked! ❤️');
        
        return {
          ...blog,
          likes: newLikes
        };
      }
      return blog;
    }));
  };

  const addComment = (blogId: string, content: string, isAnonymous = false) => {
    if (!user && !isAnonymous) {
      toast.error('Please log in to comment');
      return;
    }

    const newComment: Comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      authorId: isAnonymous ? 'anonymous' : user!.id,
      authorName: isAnonymous ? 'Anonymous' : user!.username,
      authorAvatar: isAnonymous ? undefined : user!.avatar,
      content,
      createdAt: new Date(),
      isAnonymous,
    };

    // Immediate update
    setBlogs(prev => prev.map(blog => 
      blog.id === blogId 
        ? { ...blog, comments: [...blog.comments, newComment] }
        : blog
    ));

    toast.success('Comment added! 💬');
  };

  const deleteComment = (blogId: string, commentId: string) => {
    if (!user) return;

    setBlogs(prev => prev.map(blog => 
      blog.id === blogId 
        ? { 
            ...blog, 
            comments: blog.comments.filter(comment => 
              comment.id !== commentId || 
              (comment.authorId !== user.id && !user.id.startsWith('admin'))
            )
          }
        : blog
    ));

    toast.success('Comment deleted');
  };

  const incrementViews = (id: string) => {
    setBlogs(prev => prev.map(blog => 
      blog.id === id 
        ? { ...blog, views: blog.views + 1 }
        : blog
    ));
  };

  const searchBlogs = (query: string): Blog[] => {
    const lowercaseQuery = query.toLowerCase();
    return blogs.filter(blog =>
      blog.title.toLowerCase().includes(lowercaseQuery) ||
      blog.excerpt.toLowerCase().includes(lowercaseQuery) ||
      blog.content.toLowerCase().includes(lowercaseQuery) ||
      blog.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      blog.category.toLowerCase().includes(lowercaseQuery) ||
      blog.authorName.toLowerCase().includes(lowercaseQuery)
    );
  };

  const getBlogsByCategory = (category: string): Blog[] => {
    return blogs.filter(blog => blog.category === category);
  };

  const getBlogsByTag = (tag: string): Blog[] => {
    return blogs.filter(blog => blog.tags && blog.tags.includes(tag));
  };

  const getBlogsByAuthor = (authorId: string): Blog[] => {
    return blogs.filter(blog => blog.authorId === authorId);
  };

  const getSpotlightBlogs = (): Blog[] => {
    return blogs.filter(blog => blog.isSpotlight);
  };

  const getSortedBlogs = (blogsToSort: Blog[] = blogs): Blog[] => {
    const sorted = [...blogsToSort].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'recent':
          comparison = b.createdAt.getTime() - a.createdAt.getTime();
          break;
        case 'oldest':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'likes':
          comparison = b.likes.length - a.likes.length;
          break;
        case 'views':
          comparison = b.views - a.views;
          break;
        default:
          comparison = b.createdAt.getTime() - a.createdAt.getTime();
      }
      
      return sortOrder === 'desc' ? comparison : -comparison;
    });
    
    return sorted;
  };

  const getAllCategories = (): string[] => {
    const categories = [...new Set(blogs.map(blog => blog.category))];
    return categories.sort();
  };

  const getAllTags = (): string[] => {
    const tags = [...new Set(blogs.flatMap(blog => blog.tags || []))];
    return tags.sort();
  };

  const value: BlogContextType = {
    blogs,
    sortBy,
    sortOrder,
    setSortBy,
    setSortOrder,
    createBlog,
    updateBlog,
    deleteBlog,
    toggleLikeBlog,
    addComment,
    deleteComment,
    incrementViews,
    searchBlogs,
    getBlogsByCategory,
    getBlogsByTag,
    getBlogsByAuthor,
    getSpotlightBlogs,
    getSortedBlogs,
    getAllCategories,
    getAllTags,
    refreshBlogs,
    getFullBlogContent,
  };

  return (
    <BlogContext.Provider value={value}>
      {children}
    </BlogContext.Provider>
  );
};