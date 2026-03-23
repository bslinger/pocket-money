import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, useSegments } from 'expo-router';
import type { User } from '@quiddo/shared';
import { api, getToken, setToken, clearToken } from './api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string, deviceName: string) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string, deviceName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const router = useRouter();
  const segments = useSegments();

  // On mount, check for stored token and fetch user
  useEffect(() => {
    (async () => {
      const storedToken = await getToken();
      if (storedToken) {
        try {
          const response = await api.get('/auth/user');
          setState({
            user: response.data.data,
            token: storedToken,
            isLoading: false,
            isAuthenticated: true,
          });
        } catch {
          await clearToken();
          setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
        }
      } else {
        setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
      }
    })();
  }, []);

  // Redirect based on auth state
  useEffect(() => {
    if (state.isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!state.isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (state.isAuthenticated && inAuthGroup) {
      router.replace('/(app)/(tabs)');
    }
  }, [state.isAuthenticated, state.isLoading, segments]);

  const login = useCallback(async (email: string, password: string, deviceName: string) => {
    const response = await api.post('/auth/login', { email, password, device_name: deviceName });
    const { user, token } = response.data.data;
    await setToken(token);
    setState({ user, token, isLoading: false, isAuthenticated: true });
  }, []);

  const register = useCallback(async (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string,
    deviceName: string,
  ) => {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
      device_name: deviceName,
    });
    const { user, token } = response.data.data;
    await setToken(token);
    setState({ user, token, isLoading: false, isAuthenticated: true });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors — we're logging out regardless
    }
    await clearToken();
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
