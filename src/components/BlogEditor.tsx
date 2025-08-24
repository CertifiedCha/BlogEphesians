import React, { useState, useRef, useCallback } from 'react';
import { ArrowLeft, Save, Eye, Bold, Italic, Underline, Link, Image, List, AlignLeft, AlignCenter, AlignRight, Type, Upload, X, RotateCcw, RotateCw, Maximize, Minimize } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Slider } from './ui/slider';
import { useBlog } from '../contexts/BlogContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { CATEGORIES } from '../utils/constants';
import { generateExcerpt, calculateReadTime } from '../utils/helpers';

interface BlogEditorProps {
  onBack: () => void;
}

interface ImageElement {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
}

export const BlogEditor: React.FC<BlogEditorProps> = ({ onBack }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [isSpotlight, setIsSpotlight] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageElements, setImageElements] = useState<ImageElement[]>([]);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { createBlog } = useBlog();
  const { user } = useAuth();

  const handleSave = async () => {
    if (!user) {
      toast.error('You must be logged in to create a blog post');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a title for your blog post');
      return;
    }

    if (!content.trim() || content === '<div><br></div>' || content === '<br>') {
      toast.error('Please add some content to your blog post');
      return;
    }

    if (!category) {
      toast.error('Please select a category for your blog post');
      return;
    }

    setIsSaving(true);

    try {
      const blogData = {
        title: title.trim(),
        content: content.trim(),
        excerpt: generateExcerpt(content, 200),
        category,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        isSpotlight,
      };

      const blogId = await createBlog(blogData);
      
      // Save blog data to localStorage as backup
      const savedBlogs = JSON.parse(localStorage.getItem('blogverse_blogs') || '[]');
      localStorage.setItem('blogverse_blogs', JSON.stringify(savedBlogs));
      
      toast.success('Blog post published successfully! 🎉');
      
      // Clear form
      setTitle('');
      setContent('');
      setCategory('');
      setTags('');
      setIsSpotlight(false);
      setImageElements([]);
      
      if (contentRef.current) {
        contentRef.current.innerHTML = '';
      }
      
      onBack();
    } catch (error) {
      console.error('Failed to publish blog post:', error);
      toast.error('Failed to publish blog post. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (contentRef.current) {
      setContent(contentRef.current.innerHTML);
    }
  }, []);

  const insertHeading = useCallback((level: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      
      if (selectedText) {
        // If text is selected, wrap it in heading
        const headingElement = document.createElement(level);
        headingElement.textContent = selectedText;
        range.deleteContents();
        range.insertNode(headingElement);
      } else {
        // If no text selected, insert new heading
        const headingElement = document.createElement(level);
        headingElement.textContent = `Heading ${level.slice(1)}`;
        range.insertNode(headingElement);
      }
      
      if (contentRef.current) {
        setContent(contentRef.current.innerHTML);
      }
    }
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageId = Date.now().toString();
        const imageSrc = e.target?.result as string;
        
        const newImageElement: ImageElement = {
          id: imageId,
          src: imageSrc,
          width: 100,
          height: 200,
          alt: file.name
        };
        
        setImageElements(prev => [...prev, newImageElement]);
        
        const img = `
          <div class="image-container" data-image-id="${imageId}" style="position: relative; display: inline-block; margin: 10px 0;">
            <img src="${imageSrc}" alt="${file.name}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" data-image-id="${imageId}" />
            <button class="image-controls" data-action="select" data-image-id="${imageId}" style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7); color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;">Select</button>
          </div>
        `;
        
        execCommand('insertHTML', img);
      };
      reader.readAsDataURL(file);
    }
  }, [execCommand]);

  const handleImageAction = useCallback((action: string, imageId: string) => {
    if (action === 'select') {
      setSelectedImage(imageId);
    } else if (action === 'delete') {
      // Remove image from DOM
      const imageContainer = document.querySelector(`[data-image-id="${imageId}"]`);
      if (imageContainer) {
        imageContainer.remove();
        if (contentRef.current) {
          setContent(contentRef.current.innerHTML);
        }
      }
      
      // Remove from state
      setImageElements(prev => prev.filter(img => img.id !== imageId));
      setSelectedImage(null);
    }
  }, []);

  const resizeImage = useCallback((imageId: string, newWidth: number) => {
    const img = document.querySelector(`img[data-image-id="${imageId}"]`) as HTMLImageElement;
    if (img) {
      img.style.width = `${newWidth}%`;
      img.style.maxWidth = `${newWidth}%`;
      
      if (contentRef.current) {
        setContent(contentRef.current.innerHTML);
      }
    }
  }, []);

  const insertLink = useCallback(() => {
    const url = prompt('Enter the URL:');
    if (url) {
      const text = prompt('Enter the link text:', url);
      if (text) {
        const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: var(--primary); text-decoration: underline;">${text}</a>`;
        execCommand('insertHTML', linkHtml);
      }
    }
  }, [execCommand]);

  // Handle clicks on images in the editor
  const handleEditorClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    if (target.tagName === 'BUTTON' && target.dataset.action) {
      e.preventDefault();
      const action = target.dataset.action;
      const imageId = target.dataset.imageId;
      if (imageId) {
        handleImageAction(action, imageId);
      }
    } else if (target.tagName === 'IMG' && target.dataset.imageId) {
      e.preventDefault();
      setSelectedImage(target.dataset.imageId);
    }
  }, [handleImageAction]);

  const selectedImageData = imageElements.find(img => img.id === selectedImage);

  const renderPreview = () => {
    if (!title && !content) return <p className="text-muted-foreground">Start writing to see preview...</p>;
    
    // Clean content for preview (remove image controls)
    const cleanContent = content.replace(/<button[^>]*class="image-controls"[^>]*>.*?<\/button>/g, '');
    
    return (
      <div className="prose prose-lg max-w-none">
        <h1 className="text-4xl font-bold mb-4">{title || 'Untitled'}</h1>
        <div className="flex items-center space-x-2 mb-6">
          {category && (
            <Badge className="bg-gradient-to-r from-primary to-blue-600 text-white">
              {category}
            </Badge>
          )}
          {tags && tags.split(',').map(tag => tag.trim()).filter(tag => tag).map(tag => (
            <Badge key={tag} variant="outline">#{tag}</Badge>
          ))}
          <Badge variant="secondary">{calculateReadTime(content)} min read</Badge>
        </div>
        <div dangerouslySetInnerHTML={{ __html: cleanContent || '<p>No content yet...</p>' }} />
      </div>
    );
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
            <div className="flex items-center space-x-4">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" onClick={onBack} className="rounded-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </motion.div>
              <h1 className="text-xl font-bold">Create New Post</h1>
            </div>

            <div className="flex items-center space-x-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  onClick={() => setIsPreview(!isPreview)}
                  className="flex items-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>{isPreview ? 'Edit' : 'Preview'}</span>
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !title.trim() || !content.trim() || !category}
                  className="playful-button"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Publishing...' : 'Publish'}
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {!isPreview ? (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {/* Title Input */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-6">
                  <Input
                    type="text"
                    placeholder="Enter your blog title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-2xl font-bold border-none bg-transparent p-0 placeholder:text-muted-foreground/50 focus:ring-0"
                  />
                </CardContent>
              </Card>

              {/* Metadata */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Category *</label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Tags</label>
                      <Input
                        type="text"
                        placeholder="Enter tags separated by commas"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="spotlight"
                      checked={isSpotlight}
                      onChange={(e) => setIsSpotlight(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="spotlight" className="text-sm">Featured in spotlight</label>
                  </div>
                </CardContent>
              </Card>

              {/* Editor */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Content Editor</CardTitle>
                  
                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center gap-1 p-3 bg-muted/30 rounded-lg border border-border/50">
                    {/* Text Formatting */}
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => execCommand('bold')}
                        className="w-8 h-8"
                        title="Bold"
                      >
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => execCommand('italic')}
                        className="w-8 h-8"
                        title="Italic"
                      >
                        <Italic className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => execCommand('underline')}
                        className="w-8 h-8"
                        title="Underline"
                      >
                        <Underline className="w-4 h-4" />
                      </Button>
                    </div>

                    <Separator orientation="vertical" className="h-6" />

                    {/* Headings */}
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertHeading('h1')}
                        className="h-8 px-2 text-xs"
                        title="Heading 1"
                      >
                        H1
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertHeading('h2')}
                        className="h-8 px-2 text-xs"
                        title="Heading 2"
                      >
                        H2
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertHeading('h3')}
                        className="h-8 px-2 text-xs"
                        title="Heading 3"
                      >
                        H3
                      </Button>
                    </div>

                    <Separator orientation="vertical" className="h-6" />

                    {/* Alignment */}
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => execCommand('justifyLeft')}
                        className="w-8 h-8"
                        title="Align Left"
                      >
                        <AlignLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => execCommand('justifyCenter')}
                        className="w-8 h-8"
                        title="Align Center"
                      >
                        <AlignCenter className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => execCommand('justifyRight')}
                        className="w-8 h-8"
                        title="Align Right"
                      >
                        <AlignRight className="w-4 h-4" />
                      </Button>
                    </div>

                    <Separator orientation="vertical" className="h-6" />

                    {/* Lists and Elements */}
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => execCommand('insertUnorderedList')}
                        className="w-8 h-8"
                        title="Bullet List"
                      >
                        <List className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => execCommand('insertOrderedList')}
                        className="w-8 h-8"
                        title="Numbered List"
                      >
                        <Type className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={insertLink}
                        className="w-8 h-8"
                        title="Insert Link"
                      >
                        <Link className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-8 h-8"
                        title="Insert Image"
                      >
                        <Image className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div
                    ref={contentRef}
                    contentEditable
                    className="min-h-[400px] p-4 border border-border/50 rounded-lg bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/20 prose prose-sm max-w-none"
                    style={{ whiteSpace: 'pre-wrap' }}
                    onInput={(e) => setContent(e.currentTarget.innerHTML)}
                    onClick={handleEditorClick}
                    placeholder="Start writing your blog post here..."
                    suppressContentEditableWarning={true}
                  />

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </CardContent>
              </Card>

              {/* Image Controls */}
              <AnimatePresence>
                {selectedImage && selectedImageData && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                  >
                    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center justify-between">
                          Image Controls
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedImage(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-xs text-muted-foreground mb-2 block">Image Width (%)</label>
                          <Slider
                            value={[selectedImageData.width]}
                            onValueChange={(value) => resizeImage(selectedImage, value[0])}
                            max={100}
                            min={10}
                            step={5}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>10%</span>
                            <span>{selectedImageData.width}%</span>
                            <span>100%</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleImageAction('delete', selectedImage)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Delete Image
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderPreview()}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};