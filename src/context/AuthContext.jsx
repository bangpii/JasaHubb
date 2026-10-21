import React, { createContext, useState, useContext, useEffect } from 'react';
import { API_BASE } from '../services/api';

// Create Context
const AuthContext = createContext();

// Export Provider dan Context
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        const response = await fetch(`${API_BASE}/api/verify`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, { persist = true, role } = {}) => {
    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        (persist ? localStorage : sessionStorage).setItem('token', data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Terjadi kesalahan saat login' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;