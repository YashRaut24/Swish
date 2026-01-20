import React, { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const userData = localStorage.getItem(STORAGE_KEYS.USER);

      if (token && userData) {
        const parsed = JSON.parse(userData);
        if (!parsed || !parsed._id) {
          logout();
          return;
        }
        // Ensure name field exists for display
        parsed.name = parsed.name || parsed.username;
        setUser(parsed);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, token) => {
    try {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch {}
    setUser(null);
  };

  const updateUser = (updates) => {
    if (!user || !user._id) return; // Prevent updating if user data is incomplete
    // Merge updates with existing user data, don't replace it
    const userData = { ...user, ...updates };
    userData.name = userData.name || userData.username;
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    setUser(userData);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'Admin',
    isFaculty: user?.role === 'Faculty',
    isViewOnly: user?.role === 'Admin' || user?.email === 'admin@campus.edu',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
