import React, { createContext, useContext, useReducer, useCallback } from 'react';

import { ACCOUNT_ROLES, getRoleLabel, normalizeRole } from '../constants/roles';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        isAuthenticated: true, 
        user: action.payload, 
        error: null 
      };
    case 'LOGIN_FAILURE':
      return { ...state, loading: false, error: action.payload };
    case 'LOGOUT':
      return { ...state, isAuthenticated: false, user: null, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'UPDATE_PROFILE':
      return { ...state, user: action.payload };
    default:
      return state;
  }
}

function normalizeUser(user) {
  if (!user) return user;
  const normalizedRole = normalizeRole(user.role);
  return {
    ...user,
    role: normalizedRole,
    roleLabel: getRoleLabel(normalizedRole),
  };
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = useCallback(async (email, password, selectedRole = ACCOUNT_ROLES.TEACHER) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (email && password) {
        const username = email.split('@')[0];
        const formattedName = username
          .split(/[._-]/)
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
        const normalizedRole = normalizeRole(selectedRole);
        const user = {
          id: 1,
          name: formattedName || 'User',
          email,
          role: normalizedRole,
          roleLabel: getRoleLabel(normalizedRole),
          phone: '',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        };
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        localStorage.setItem('auth_user', JSON.stringify(user));
        localStorage.setItem('auth_token', 'mock-jwt-token-' + Date.now());
        return { success: true };
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: error.message });
      return { success: false, error: error.message };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const checkAuth = useCallback(() => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const storedUser = localStorage.getItem('auth_user');
      const token = localStorage.getItem('auth_token');
      
      if (storedUser && token) {
        const normalizedUser = normalizeUser(JSON.parse(storedUser));
        dispatch({ type: 'LOGIN_SUCCESS', payload: normalizedUser });
        localStorage.setItem('auth_user', JSON.stringify(normalizedUser));
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const updateProfile = useCallback(async (updates) => {
    if (!state.user) {
      return { success: false, error: 'No authenticated user found.' };
    }

    const nextUser = {
      ...state.user,
      ...updates,
    };
    const normalizedRole = normalizeRole(nextUser.role);
    nextUser.role = normalizedRole;
    nextUser.roleLabel = getRoleLabel(normalizedRole);

    if (!nextUser.avatar) {
      const avatarSeed = nextUser.email || nextUser.name || 'user';
      nextUser.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`;
    }

    dispatch({ type: 'UPDATE_PROFILE', payload: nextUser });
    try {
      localStorage.setItem('auth_user', JSON.stringify(nextUser));
      return { success: true, user: nextUser };
    } catch (_error) {
      return {
        success: true,
        user: nextUser,
        warning: 'Profile updated for this session. Storage is full, so it may not persist after refresh.',
      };
    }
  }, [state.user]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, checkAuth, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
