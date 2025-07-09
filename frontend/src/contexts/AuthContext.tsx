import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, authAPI } from '../services/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          
          // Only verify token if not on auth pages to prevent redirect loops
          const currentPath = window.location.pathname;
          if (currentPath !== '/login' && currentPath !== '/signup' && currentPath !== '/register') {
            // Verify token is still valid
            await authAPI.getMe();
          }
        } catch (error) {
          // Token is invalid, clear auth data
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      toast.success('Login successful!');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const register = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      const response = await authAPI.register({ email, password, firstName, lastName });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      toast.success('Registration successful!');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
