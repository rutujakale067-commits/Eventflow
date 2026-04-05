// =============================================
// FILE: /frontend/src/context/AuthContext.js
// CHANGES:
//   • Decode role from JWT payload (no extra request)
//   • Expose permissions object from /auth/permissions
//   • hasPermission(key) helper for UI gating
// =============================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

// ─── Decode JWT payload without library ───────────────────────────────────────
const decodeToken = (token) => {
  try {
    const base64 = token.split('.')[1];
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]               = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [permissions, setPermissions] = useState(null); // NEW
  const [loading, setLoading]         = useState(true);

  // ─── Load permissions after we know who the user is ──────────────────────
  const loadPermissions = useCallback(async () => {
    try {
      const res = await authAPI.getPermissions();
      setPermissions(res.data.permissions);
    } catch {
      setPermissions(null);
    }
  }, []);

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.getMe()
        .then(res => {
          setUser(res.data.user);
          loadPermissions();
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [loadPermissions]);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    // Load permissions right after login
    try {
      const pRes = await authAPI.getPermissions();
      setPermissions(pRes.data.permissions);
    } catch { /* non-critical */ }
    return user;
  }, []);

  const register = useCallback(async (name, email, password, phone) => {
    const res = await authAPI.register({ name, email, password, phone });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setPermissions(null);
    toast.success('Logged out successfully');
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  // NEW: convenience helper — check a single permission key
  // Usage: hasPermission('createEvent') → true/false
  const hasPermission = useCallback((key) => {
    if (!permissions) return false;
    return permissions[key] === true;
  }, [permissions]);

  return (
    <AuthContext.Provider value={{
      user,
      permissions,        // NEW: full permissions map
      loading,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      updateUser,
      hasPermission,      // NEW: UI-gating helper
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
