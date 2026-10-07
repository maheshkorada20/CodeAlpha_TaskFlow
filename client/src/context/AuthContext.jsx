import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('taskflow_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and check token validity
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('taskflow_token');
      if (savedToken) {
        try {
          const res = await authService.getMe();
          if (res.success && res.data?.user) {
            setUser(res.data.user);
          } else {
            logout();
          }
        } catch (err) {
          console.warn('Auth token expired or invalid:', err.message);
          logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    if (res && res.success && res.data?.token) {
      const userData = res.data.user;
      localStorage.setItem('taskflow_token', res.data.token);
      setToken(res.data.token);
      setUser(userData);
      return userData;
    }
    throw new Error((res && res.message) || 'Login failed');
  };

  const register = async (userData) => {
    const res = await authService.register(userData);
    if (res && res.success && res.data?.token) {
      const newUser = res.data.user;
      localStorage.setItem('taskflow_token', res.data.token);
      setToken(res.data.token);
      setUser(newUser);
      return newUser;
    }
    throw new Error((res && res.message) || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('taskflow_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isAdmin: user?.globalRole === 'admin',
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
