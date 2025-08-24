import React, { useState, useEffect } from 'react';
import { AlertTriangle, HardDrive, Trash2, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { motion, AnimatePresence } from 'motion/react';
import { getStorageUsage, cleanupStorage } from '../utils/storage';
import { toast } from 'sonner@2.0.3';

interface StorageMonitorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StorageMonitor: React.FC<StorageMonitorProps> = ({ isOpen, onClose }) => {
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 0, percentage: 0 });
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const updateStorageInfo = () => {
    const info = getStorageUsage();
    setStorageInfo(info);
  };

  useEffect(() => {
    if (isOpen) {
      updateStorageInfo();
      const interval = setInterval(updateStorageInfo, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleCleanup = async () => {
    setIsCleaningUp(true);
    try {
      cleanupStorage();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate cleanup time
      updateStorageInfo();
      toast.success('Storage cleanup completed!');
    } catch (error) {
      toast.error('Failed to cleanup storage');
    } finally {
      setIsCleaningUp(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStorageStatus = () => {
    if (storageInfo.percentage > 90) return { color: 'destructive', status: 'Critical' };
    if (storageInfo.percentage > 75) return { color: 'warning', status: 'High' };
    if (storageInfo.percentage > 50) return { color: 'primary', status: 'Medium' };
    return { color: 'success', status: 'Good' };
  };

  const storageStatus = getStorageStatus();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="bg-card/95 backdrop-blur-lg border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <HardDrive className="w-5 h-5" />
                <span>Storage Monitor</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Storage Usage */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Storage Used</span>
                  <span className={`font-medium ${
                    storageStatus.color === 'destructive' ? 'text-destructive' :
                    storageStatus.color === 'warning' ? 'text-yellow-600' :
                    'text-foreground'
                  }`}>
                    {storageStatus.status}
                  </span>
                </div>
                
                <Progress 
                  value={storageInfo.percentage} 
                  className="h-2"
                />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatBytes(storageInfo.used)} used</span>
                  <span>{formatBytes(storageInfo.total)} total</span>
                </div>
              </div>

              {/* Warning Alert */}
              {storageInfo.percentage > 75 && (
                <Alert variant={storageInfo.percentage > 90 ? "destructive" : "default"}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {storageInfo.percentage > 90 
                      ? "Storage critically low! Some features may not work properly."
                      : "Storage is running low. Consider cleaning up old data."
                    }
                  </AlertDescription>
                </Alert>
              )}

              {/* Storage Breakdown */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Storage Breakdown</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Blog Posts</span>
                    <span>~60%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>User Data</span>
                    <span>~20%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache & Temp</span>
                    <span>~20%</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={updateStorageInfo}
                  className="flex items-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCleanup}
                  disabled={isCleaningUp}
                  className="flex items-center space-x-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{isCleaningUp ? 'Cleaning...' : 'Cleanup'}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="ml-auto"
                >
                  Close
                </Button>
              </div>

              {/* Tips */}
              <div className="text-xs text-muted-foreground pt-2 border-t">
                <p><strong>Tips:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li>Blog content is automatically compressed</li>
                  <li>Old temporary data is cleaned regularly</li>
                  <li>Consider deleting unused blog posts</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};