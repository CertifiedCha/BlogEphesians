import React, { useState, useRef } from 'react';
import { X, Camera, User, Mail, Calendar, Edit3, Save, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { formatDate } from '../utils/helpers';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [description, setDescription] = useState(user?.description || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user || !isOpen) return null;

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }

      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setAvatarPreview(result);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }

    updateProfile({
      username: username.trim(),
      bio: bio.trim(),
      description: description.trim(),
      avatar: avatarPreview,
    });

    setIsEditing(false);
    toast.success('Profile updated successfully! ✨');
  };

  const handleCancel = () => {
    setUsername(user.username);
    setBio(user.bio || '');
    setDescription(user.description || '');
    setAvatarPreview(user.avatar || '');
    setIsEditing(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          <Card className="bg-card/95 backdrop-blur-lg border-border/50 shadow-2xl">
            <CardHeader className="relative pb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="absolute right-2 top-2 w-8 h-8 rounded-full hover:bg-accent"
              >
                <X className="w-4 h-4" />
              </Button>
              
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <CardTitle className="text-2xl text-center bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Profile Settings
                </CardTitle>
                <p className="text-center text-muted-foreground mt-2">
                  Customize your profile and make it uniquely yours
                </p>
              </motion.div>
            </CardHeader>

            <CardContent className="space-y-8">
              {/* Avatar Section */}
              <motion.div
                className="flex flex-col items-center space-y-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <div className="relative group">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Avatar className="w-24 h-24 border-4 border-primary/20 shadow-lg">
                      <AvatarImage src={avatarPreview} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white text-2xl">
                        {username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                  
                  {isEditing && (
                    <motion.div
                      className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isUploading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Upload className="w-6 h-6 text-white" />
                        </motion.div>
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </motion.div>
                  )}
                </div>

                {isEditing && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="hover:bg-primary/10 hover:border-primary/30 transition-colors"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {isUploading ? 'Uploading...' : 'Change Photo'}
                    </Button>
                  </motion.div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </motion.div>

              {/* Profile Info */}
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {/* Username */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center">
                    <User className="w-4 h-4 mr-2 text-primary" />
                    Username
                  </label>
                  {isEditing ? (
                    <Input
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                    />
                  ) : (
                    <p className="text-lg font-medium">{user.username}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-primary" />
                    Email
                  </label>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center">
                    <Edit3 className="w-4 h-4 mr-2 text-primary" />
                    Bio
                  </label>
                  {isEditing ? (
                    <Textarea
                      placeholder="Tell us about yourself..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="min-h-[80px] transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                      maxLength={150}
                    />
                  ) : (
                    <p className="text-muted-foreground">
                      {user.bio || 'No bio added yet'}
                    </p>
                  )}
                  {isEditing && (
                    <p className="text-xs text-muted-foreground text-right">
                      {bio.length}/150 characters
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center">
                    <Edit3 className="w-4 h-4 mr-2 text-primary" />
                    Description
                  </label>
                  {isEditing ? (
                    <Textarea
                      placeholder="A longer description about yourself..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[120px] transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                      maxLength={500}
                    />
                  ) : (
                    <p className="text-muted-foreground">
                      {user.description || 'No description added yet'}
                    </p>
                  )}
                  {isEditing && (
                    <p className="text-xs text-muted-foreground text-right">
                      {description.length}/500 characters
                    </p>
                  )}
                </div>

                {/* Account Info */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-primary" />
                    Member since
                  </label>
                  <div className="flex items-center space-x-2">
                    <p className="text-muted-foreground">
                      {formatDate(user.joinedAt)}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {Math.floor((new Date().getTime() - user.joinedAt.getTime()) / (1000 * 60 * 60 * 24))} days
                    </Badge>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{user.following.length}</p>
                    <p className="text-sm text-muted-foreground">Following</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{user.followers.length}</p>
                    <p className="text-sm text-muted-foreground">Followers</p>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                className="flex justify-end space-x-3 pt-4 border-t border-border/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                {isEditing ? (
                  <>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        className="hover:bg-muted transition-colors"
                      >
                        Cancel
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={handleSave}
                        className="playful-button"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    </motion.div>
                  </>
                ) : (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="playful-button"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};