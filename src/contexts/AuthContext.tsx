import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { saveToStorage, loadFromStorage, removeFromStorage } from '../utils/storage';
import { toast } from 'sonner@2.0.3';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  description?: string;
  joinedAt: Date;
  followers: string[];
  following: string[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<Omit<User, 'id' | 'email' | 'joinedAt' | 'followers' | 'following'>>) => void;
  followUser: (userId: string) => void;
  unfollowUser: (userId: string) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from storage on mount
  useEffect(() => {
    try {
      const savedUser = loadFromStorage<User>('blogverse_user');
      if (savedUser) {
        // Convert joinedAt string back to Date
        const userWithDate = {
          ...savedUser,
          joinedAt: new Date(savedUser.joinedAt)
        };
        setUser(userWithDate);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      removeFromStorage('blogverse_user');
      toast.error('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save user to storage whenever user changes
  useEffect(() => {
    if (user) {
      const success = saveToStorage('blogverse_user', user);
      if (!success) {
        toast.error('Failed to save user data - storage full');
      }
    } else {
      removeFromStorage('blogverse_user');
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user exists in storage (for demo purposes)
      const savedUsers = loadFromStorage<Record<string, any>>('blogverse_users', {});
      const existingUser = savedUsers[email];
      
      if (existingUser && existingUser.password === password) {
        const { password: _, ...userWithoutPassword } = existingUser;
        const userWithDate = {
          ...userWithoutPassword,
          joinedAt: new Date(userWithoutPassword.joinedAt)
        };
        setUser(userWithDate);
        toast.success('Welcome back!');
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user already exists
      const savedUsers = loadFromStorage<Record<string, any>>('blogverse_users', {});
      if (savedUsers[email]) {
        throw new Error('User with this email already exists');
      }
      
      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username,
        email,
        avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format&q=80`,
        bio: '',
        description: '',
        joinedAt: new Date(),
        followers: [],
        following: [],
      };
      
      // Save to users collection
      savedUsers[email] = { ...newUser, password };
      const success = saveToStorage('blogverse_users', savedUsers);
      
      if (success) {
        setUser(newUser);
        toast.success('Account created successfully!');
      } else {
        throw new Error('Failed to save user data - storage full');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Signup failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    removeFromStorage('blogverse_user');
    toast.success('Logged out successfully');
  };

  const updateProfile = (updates: Partial<Omit<User, 'id' | 'email' | 'joinedAt' | 'followers' | 'following'>>) => {
    if (!user) {
      toast.error('No user logged in');
      return;
    }

    try {
      const updatedUser: User = {
        ...user,
        ...updates,
        // Ensure these fields are never overwritten
        id: user.id,
        email: user.email,
        joinedAt: user.joinedAt,
        followers: user.followers,
        following: user.following,
      };

      // Update user state
      setUser(updatedUser);

      // Update in users collection
      try {
        const savedUsers = loadFromStorage<Record<string, any>>('blogverse_users', {});
        if (savedUsers[user.email]) {
          savedUsers[user.email] = {
            ...savedUsers[user.email],
            ...updates
          };
          const success = saveToStorage('blogverse_users', savedUsers);
          if (!success) {
            toast.warning('Profile updated but failed to save to storage');
          }
        }
      } catch (error) {
        console.error('Error updating user in collection:', error);
        toast.warning('Profile updated locally but may not persist');
      }

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      throw new Error('Failed to update profile');
    }
  };

  const followUser = (userId: string) => {
    if (!user) return;
    
    try {
      const updatedUser = {
        ...user,
        following: user.following.includes(userId) 
          ? user.following 
          : [...user.following, userId]
      };
      setUser(updatedUser);
      toast.success('User followed!');
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
    }
  };

  const unfollowUser = (userId: string) => {
    if (!user) return;
    
    try {
      const updatedUser = {
        ...user,
        following: user.following.filter(id => id !== userId)
      };
      setUser(updatedUser);
      toast.success('User unfollowed');
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast.error('Failed to unfollow user');
    }
  };

  const value: AuthContextType = {
    user,
    login,
    signup,
    logout,
    updateProfile,
    followUser,
    unfollowUser,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};