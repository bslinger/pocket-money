import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, useSegments } from 'expo-router';
import type { User, ClaimDeviceResponse } from '@quiddo/shared';
import { api, getToken, setToken, clearToken, setSuppressAutoClear } from './api';
import { registerForPushNotifications, unregisterPushToken } from './notifications';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isChildDevice: boolean;
  childSpender: ClaimDeviceResponse['spender'] | null;
  authError: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string, deviceName: string) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string, deviceName: string) => Promise<void>;
  childLogin: (code: string, deviceName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
    isChildDevice: false,
    childSpender: null,
    authError: null,
  });

  const router = useRouter();
  const segments = useSegments();

  // On mount, check for stored token and fetch user
  useEffect(() => {
    (async () => {
      const storedToken = await getToken();
      if (!storedToken) {
        setState(s => ({ ...s, isLoading: false }));
        return;
      }

      // Suppress 401 auto-clear while we probe both auth endpoints
      setSuppressAutoClear(true);

      // Try parent auth first
      try {
        const response = await api.get('/auth/user');
        setSuppressAutoClear(false);
        setState({
          user: response.data.data,
          token: storedToken,
          isLoading: false,
          isAuthenticated: true,
          isChildDevice: false,
          childSpender: null,
          authError: null,
        });
        registerForPushNotifications(false);
        return;
      } catch {
        // Not a parent token — try child device
      }

      try {
        const response = await api.get('/child/dashboard');
        setSuppressAutoClear(false);
        const { spender } = response.data.data;
        setState({
          user: null,
          token: storedToken,
          isLoading: false,
          isAuthenticated: true,
          isChildDevice: true,
          childSpender: spender,
          authError: null,
        });
        registerForPushNotifications(true);
      } catch {
        setSuppressAutoClear(false);
        await clearToken();
        setState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
          isChildDevice: false,
          childSpender: null,
          authError: 'Your session has expired. Please sign in again.',
        });
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
      // Both parent and child devices go to the same tabs — the dashboard
      // component already renders a child-specific view when isParent is false
      router.replace('/(app)/(tabs)');
    }
  }, [state.isAuthenticated, state.isLoading, segments]);

  const login = useCallback(async (email: string, password: string, deviceName: string) => {
    const response = await api.post('/auth/login', { email, password, device_name: deviceName });
    const { user, token } = response.data.data;
    await setToken(token);
    setState({ user, token, isLoading: false, isAuthenticated: true, isChildDevice: false, childSpender: null, authError: null });
    registerForPushNotifications(false);
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
    setState({ user, token, isLoading: false, isAuthenticated: true, isChildDevice: false, childSpender: null, authError: null });
    registerForPushNotifications(false);
  }, []);

  const childLogin = useCallback(async (code: string, deviceName: string) => {
    const response = await api.post('/spender-devices/claim', { code, device_name: deviceName });
    const { token, spender } = response.data.data;
    await setToken(token);
    setState({ user: null, token, isLoading: false, isAuthenticated: true, isChildDevice: true, childSpender: spender, authError: null });
    registerForPushNotifications(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      await unregisterPushToken(state.isChildDevice);
    } catch {
      // Best-effort — don't block logout
    }
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors — we're logging out regardless
    }
    await clearToken();
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false, isChildDevice: false, childSpender: null, authError: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, childLogin, logout }}>
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
