import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

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

  useEffect(() => {
    // 로그인 페이지에서는 인증 체크 하지 않음
    if (window.location.pathname === '/login') {
      setLoading(false);
      return;
    }
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get('http://localhost:3001/auth/user', {
        withCredentials: true,
        validateStatus: (status) => {
          // 200-299와 401은 정상으로 처리 (에러 던지지 않음)
          return (status >= 200 && status < 300) || status === 401;
        }
      });

      if (response.status === 401) {
        setUser(null);
      } else {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.get('http://localhost:3001/auth/logout', {
        withCredentials: true
      });
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    loading,
    checkAuth,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
