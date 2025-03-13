import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set auth token in axios headers
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
      localStorage.removeItem('token');
    }
  };

  // Load user from token
  const loadUser = async () => {
    if (token) {
      setAuthToken(token);
      try {
        const res = await axios.get('/api/auth/me');
        setUser(res.data.user);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Error loading user:', err);
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        setAuthToken(null);
      }
    }
    setIsLoading(false);
  };

  // Register user
  const register = async (formData) => {
    try {
      const res = await axios.post('/api/auth/register', formData);
      setToken(res.data.token);
      setAuthToken(res.data.token);
      await loadUser();
      toast.success('Registration successful!');
      return true;
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err.response?.data?.message || 'Registration failed';
      toast.error(errorMessage);
      return false;
    }
  };

  // Login user
  const login = async (formData) => {
    try {
      const res = await axios.post('/api/auth/login', formData);
      setToken(res.data.token);
      setAuthToken(res.data.token);
      await loadUser();
      toast.success('Login successful!');
      return true;
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || 'Login failed';
      toast.error(errorMessage);
      return false;
    }
  };

  // Logout user
  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setAuthToken(null);
    toast.info('Logged out successfully');
  };

  // Check if token is expired
  const isTokenExpired = (token) => {
    try {
      const decoded = jwt_decode(token);
      return decoded.exp < Date.now() / 1000;
    } catch (err) {
      return true;
    }
  };

  // Initialize auth state
  useEffect(() => {
    if (token && !isTokenExpired(token)) {
      loadUser();
    } else {
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setAuthToken(null);
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated,
        isLoading,
        user,
        register,
        login,
        logout,
        loadUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
