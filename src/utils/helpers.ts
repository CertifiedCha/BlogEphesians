import { CATEGORY_GRADIENTS } from './constants';

export const getCategoryGradient = (category: string): string => {
  return CATEGORY_GRADIENTS[category as keyof typeof CATEGORY_GRADIENTS] || 'from-blue-500 to-purple-600';
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export const formatDateWithTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(date);
};

export const stripHtmlTags = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};

export const generateExcerpt = (content: string, maxLength: number = 200): string => {
  const textContent = stripHtmlTags(content);
  return textContent.length > maxLength 
    ? textContent.substring(0, maxLength) + '...' 
    : textContent;
};

export const calculateReadTime = (content: string, wordsPerMinute: number = 200): number => {
  const wordCount = stripHtmlTags(content).split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
};

export const shareContent = async (title: string, text: string, url: string): Promise<boolean> => {
  try {
    // Check if Web Share API is supported
    if (navigator.share) {
      await navigator.share({
        title,
        text,
        url,
      });
      return true;
    } else {
      // Fallback to clipboard
      const shareText = `${title}\n\n${text}\n\n${url}`;
      await navigator.clipboard.writeText(shareText);
      return false; // Indicates clipboard was used instead
    }
  } catch (error) {
    console.error('Error sharing:', error);
    try {
      // Final fallback - just copy URL
      await navigator.clipboard.writeText(url);
      return false;
    } catch (clipboardError) {
      console.error('Clipboard error:', clipboardError);
      // Create a temporary input to copy text
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        return false;
      } catch (execError) {
        console.error('execCommand failed:', execError);
        return false;
      } finally {
        document.body.removeChild(textArea);
      }
    }
  }
};

export const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};