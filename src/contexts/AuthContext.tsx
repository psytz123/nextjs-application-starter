'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, LoginCredentials, RegisterData, ApiResponse } from '@/types';
import Cookies from 'js-cookie';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const token = Cookies.get('auth-token');
    if (token) {
      try {
        // Decode JWT to get user info (simple decode, not verification)
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp > Date.now() / 1000) {
          setUser({
            id: payload.id,
            email: payload.email,
            name: payload.name,
            role: payload.role,
            isApproved: payload.isApproved,
          });
        } else {
          Cookies.remove('auth-token');
        }
      } catch (error) {
        console.error('Error parsing token:', error);
        Cookies.remove('auth-token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data: ApiResponse<{ user: AuthUser; token: string }> = await response.json();

      if (data.success && data.data) {
        setUser(data.data.user);
        Cookies.set('auth-token', data.data.token, { expires: 7 }); // 7 days
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<{ user: AuthUser; token: string }> = await response.json();

      if (result.success && result.data) {
        setUser(result.data.user);
        Cookies.set('auth-token', result.data.token, { expires: 7 }); // 7 days
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    setUser(null);
    Cookies.remove('auth-token');
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
