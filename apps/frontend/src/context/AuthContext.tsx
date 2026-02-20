// apps/frontend/src/context/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { api } from '../services/api';
import type { User, SignupData } from '@autoloan/shared-types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getInitialState(): AuthState {
  if (typeof window === 'undefined') {
    return { user: null, token: null, isLoading: true };
  }
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  if (token && user) {
    return { token, user: JSON.parse(user), isLoading: false };
  }
  return { user: null, token: null, isLoading: false };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(getInitialState);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setState({ token: res.data.token, user: res.data.user, isLoading: false });
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    const res = await api.auth.signup(data);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setState({ token: res.data.token, user: res.data.user, isLoading: false });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setState({ token: null, user: null, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
