import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('fishDeliveryToken'));

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authAPI.verifyToken(token);
        if (response.data.success) {
          setUser(response.data.data.user);
        } else {
          localStorage.removeItem('fishDeliveryToken');
          setToken(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('fishDeliveryToken');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [token]);

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await authAPI.login({ email, password });
      if (response.data.success) {
        const { user: userData, token: authToken } = response.data.data;
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
      const response = await authAPI.register(userData);
      if (response.data.success) {
        const { user: newUser, token: authToken } = response.data.data;
        localStorage.setItem('fishDeliveryToken', authToken);
        setToken(authToken);
        setUser(newUser);
        return { success: true, user: newUser };
      } else {
        return { success: false, message: response.data.message, errors: response.data.errors || [] };
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
      const response = await authAPI.updateProfile(updateData);
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;