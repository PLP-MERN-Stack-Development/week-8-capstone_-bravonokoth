import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create the Auth Context
const AuthContext = createContext();

// Custom hook to use the Auth Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('fishDeliveryToken'));

  // Configure axios defaults
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  
  // Set up axios interceptor for authentication
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Cleanup
    return () => axios.interceptors.request.eject(interceptor);
  }, [token]);

  // Set up axios response interceptor for handling auth errors
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token is invalid or expired
          logout();
        }
        return Promise.reject(error);
      }
    );

    // Cleanup
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setUser(response.data.data.user);
        } else {
          // Invalid token
          localStorage.removeItem('fishDeliveryToken');
          setToken(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Remove invalid token
        localStorage.removeItem('fishDeliveryToken');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [token, API_BASE_URL]);

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });

      if (response.data.success) {
        const { user: userData, token: authToken } = response.data.data;
        
        // Store token in localStorage
        localStorage.setItem('fishDeliveryToken', authToken);
        setToken(authToken);
        setUser(userData);

        return { success: true, user: userData };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);

      if (response.data.success) {
        const { user: newUser, token: authToken } = response.data.data;
        
        // Store token in localStorage
        localStorage.setItem('fishDeliveryToken', authToken);
        setToken(authToken);
        setUser(newUser);

        return { success: true, user: newUser };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      const errors = error.response?.data?.errors || [];
      return { success: false, message, errors };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('fishDeliveryToken');
    setToken(null);
    setUser(null);
  };

  // Update user profile
  const updateProfile = async (updateData) => {
    try {
      setLoading(true);
      const response = await axios.put(`${API_BASE_URL}/users/me`, updateData);

      if (response.data.success) {
        const updatedUser = response.data.data.user;
        setUser(updatedUser);
        return { success: true, user: updatedUser };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed. Please try again.';
      const errors = error.response?.data?.errors || [];
      return { success: false, message, errors };
    } finally {
      setLoading(false);
    }
  };

  // Check if user has a specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Check if user is admin
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  // Check if user is client
  const isClient = () => {
    return user?.role === 'client';
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user && !!token;
  };

  // Context value
  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    hasRole,
    isAdmin,
    isClient,
    isAuthenticated,
    API_BASE_URL
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;