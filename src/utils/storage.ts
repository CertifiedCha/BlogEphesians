interface StorageOptions {
  compress?: boolean;
  maxSize?: number;
  pruneOld?: boolean;
}

class StorageManager {
  private getStorageUsage(): number {
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }
    return totalSize;
  }

  private compressString(str: string): string {
    try {
      const parsed = JSON.parse(str);
      return JSON.stringify(parsed);
    } catch {
      return str.replace(/\s+/g, ' ').trim();
    }
  }

  private pruneOldData(key: string, data: any[], maxItems: number): any[] {
    if (!Array.isArray(data)) return data;
    
    return data
      .sort((a, b) => {
        const aDate = new Date(a.createdAt || a.joinedAt || 0).getTime();
        const bDate = new Date(b.createdAt || b.joinedAt || 0).getTime();
        return bDate - aDate;
      })
      .slice(0, maxItems);
  }

  private reduceDataSize(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.reduceDataSize(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const reduced: any = {};
      
      if (data.content && typeof data.content === 'string') {
        if (data.content.length > 1000) {
          reduced.content = data.content.substring(0, 1000) + '...';
          reduced.contentTruncated = true;
          reduced.fullContentHash = this.hashString(data.content);
        } else {
          reduced.content = data.content;
        }
      }
      
      Object.keys(data).forEach(key => {
        if (key !== 'content') {
          reduced[key] = data[key];
        }
      });
      
      return reduced;
    }
    
    return data;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  setItem(key: string, value: any, options: StorageOptions): boolean {
    try {
      let dataToStore = value;
      
      if (options.maxSize && JSON.stringify(value).length > options.maxSize) {
        dataToStore = this.reduceDataSize(value);
      }
      
      if (options.pruneOld && Array.isArray(dataToStore)) {
        dataToStore = this.pruneOldData(key, dataToStore, 50);
      }
      
      let stringData = JSON.stringify(dataToStore);
      
      if (options.compress) {
        stringData = this.compressString(stringData);
      }
      
      localStorage.setItem(key, stringData);
      return true;
      
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        console.warn('Storage quota exceeded for key: ' + key);
        
        this.cleanup();
        
        try {
          const reducedData = this.reduceDataSize(value);
          const prunedData = Array.isArray(reducedData) 
            ? this.pruneOldData(key, reducedData, 20) 
            : reducedData;
          
          localStorage.setItem(key, JSON.stringify(prunedData));
          console.warn('Stored reduced data for key: ' + key);
          return true;
          
        } catch (secondError) {
          console.error('Failed to store even reduced data for key: ' + key, secondError);
          return false;
        }
      } else {
        console.error('Storage error for key: ' + key, error);
        return false;
      }
    }
  }

  getItem(key: string, defaultValue: any): any {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      
      const parsed = JSON.parse(item);
      return parsed;
      
    } catch (error) {
      console.error('Error reading from storage for key: ' + key, error);
      return defaultValue;
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item for key: ' + key, error);
    }
  }

  cleanup(): void {
    const keysToCheck = Object.keys(localStorage);
    
    for (const key of keysToCheck) {
      if (key.startsWith('blogverse_temp_') || 
          key.startsWith('blogverse_cache_') ||
          key.includes('_backup')) {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error during cleanup for key: ' + key, error);
        }
      }
    }
  }

  getUsageInfo(): { used: number; total: number; percentage: number } {
    const used = this.getStorageUsage();
    const total = 5 * 1024 * 1024;
    const percentage = (used / total) * 100;
    
    return { used, total, percentage };
  }
}

export const storage = new StorageManager();

export const saveToStorage = (key: string, data: any): boolean => {
  return storage.setItem(key, data, {
    compress: true,
    maxSize: 1024 * 1024,
    pruneOld: true
  });
};

export const loadFromStorage = (key: string, defaultValue: any): any => {
  return storage.getItem(key, defaultValue);
};

export const removeFromStorage = (key: string): void => {
  storage.removeItem(key);
};

export const getStorageUsage = () => {
  return storage.getUsageInfo();
};

export const cleanupStorage = (): void => {
  storage.cleanup();
};