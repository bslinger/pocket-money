import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, useSegments } from 'expo-router';
import type { User, ClaimDeviceResponse, ClaimFamilyScreenResponse } from '@quiddo/shared';
import { api, getToken, setToken, clearToken, setSuppressAutoClear } from './api';
import { registerForPushNotifications, unregisterPushToken } from './notifications';
import { disconnectEcho } from './echo';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  isChildDevice: boolean;
  childSpender: ClaimDeviceResponse['spender'] | null;
  isFamilyScreen: boolean;
  familyScreenFamily: ClaimFamilyScreenResponse['family'] | null;
  authError: string | null;
}

interface SocialLoginParams {
  provider: 'google' | 'apple' | 'facebook';
  token: string;
  deviceName: string;
  firstName?: string;
  lastName?: string;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string, deviceName: string) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string, deviceName: string) => Promise<void>;
  socialLogin: (params: SocialLoginParams) => Promise<void>;
  childLogin: (code: string, deviceName: string) => Promise<void>;
  familyScreenLogin: (code: string, deviceName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
    needsOnboarding: false,
    isChildDevice: false,
    childSpender: null,
    isFamilyScreen: false,
    familyScreenFamily: null,
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
          needsOnboarding: false,
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
          needsOnboarding: false,
          isChildDevice: true,
          childSpender: spender,
          isFamilyScreen: false,
          familyScreenFamily: null,
          authError: null,
        });
        registerForPushNotifications(true);
        return;
      } catch {
        // Not a child token — try family screen
      }

      try {
        const response = await api.get('/family-screen/dashboard');
        setSuppressAutoClear(false);
        const { family } = response.data.data;
        setState({
          user: null,
          token: storedToken,
          isLoading: false,
          isAuthenticated: true,
          needsOnboarding: false,
          isChildDevice: false,
          childSpender: null,
          isFamilyScreen: true,
          familyScreenFamily: family,
          authError: null,
        });
      } catch {
        setSuppressAutoClear(false);
        await clearToken();
        setState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
          needsOnboarding: false,
          isChildDevice: false,
          childSpender: null,
          isFamilyScreen: false,
          familyScreenFamily: null,
          authError: 'Your session has expired. Please sign in again.',
        });
      }
    })();
  }, []);

  // Redirect based on auth state
  useEffect(() => {
    if (state.isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inFamilyScreenGroup = segments[0] === '(family-screen)';

    if (!state.isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (state.isAuthenticated && inAuthGroup) {
      if (state.isFamilyScreen) {
        router.replace('/(family-screen)/');
      } else if (state.needsOnboarding) {
        router.replace('/(app)/onboarding');
      } else {
        router.replace('/(app)/(tabs)');
      }
    } else if (state.isAuthenticated && !inAuthGroup) {
      // Ensure family screen devices stay in their group
      if (state.isFamilyScreen && !inFamilyScreenGroup) {
        router.replace('/(family-screen)/');
      } else if (!state.isFamilyScreen && inFamilyScreenGroup) {
        router.replace('/(app)/(tabs)');
      }
    }
  }, [state.isAuthenticated, state.needsOnboarding, state.isLoading, state.isFamilyScreen, segments]);

  const login = useCallback(async (email: string, password: string, deviceName: string) => {
    const response = await api.post('/auth/login', { email, password, device_name: deviceName });
    const { user, token, needs_onboarding } = response.data.data;
    await setToken(token);
    setState({ user, token, isLoading: false, isAuthenticated: true, needsOnboarding: !!needs_onboarding, isChildDevice: false, childSpender: null, isFamilyScreen: false, familyScreenFamily: null, authError: null });
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
    const { user, token, needs_onboarding } = response.data.data;
    await setToken(token);
    setState({ user, token, isLoading: false, isAuthenticated: true, needsOnboarding: !!needs_onboarding, isChildDevice: false, childSpender: null, isFamilyScreen: false, familyScreenFamily: null, authError: null });
    registerForPushNotifications(false);
  }, []);

  const socialLogin = useCallback(async ({ provider, token, deviceName, firstName, lastName }: SocialLoginParams) => {
    const response = await api.post(`/auth/social/${provider}`, {
      token,
      device_name: deviceName,
      first_name: firstName,
      last_name: lastName,
    });
    const { user, token: sanctumToken, needs_onboarding } = response.data.data;
    await setToken(sanctumToken);
    setState({ user, token: sanctumToken, isLoading: false, isAuthenticated: true, needsOnboarding: !!needs_onboarding, isChildDevice: false, childSpender: null, isFamilyScreen: false, familyScreenFamily: null, authError: null });
    registerForPushNotifications(false);
  }, []);

  const childLogin = useCallback(async (code: string, deviceName: string) => {
    const response = await api.post('/spender-devices/claim', { code, device_name: deviceName });
    const { token, spender } = response.data.data;
    await setToken(token);
    setState({ user: null, token, isLoading: false, isAuthenticated: true, needsOnboarding: false, isChildDevice: true, childSpender: spender, isFamilyScreen: false, familyScreenFamily: null, authError: null });
    registerForPushNotifications(true);
  }, []);

  const familyScreenLogin = useCallback(async (code: string, deviceName: string) => {
    const response = await api.post('/family-screen-devices/claim', { code, device_name: deviceName });
    const { token, family } = response.data.data;
    await setToken(token);
    setState({ user: null, token, isLoading: false, isAuthenticated: true, needsOnboarding: false, isChildDevice: false, childSpender: null, isFamilyScreen: true, familyScreenFamily: family, authError: null });
  }, []);

  const logout = useCallback(async () => {
    disconnectEcho();
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
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false, needsOnboarding: false, isChildDevice: false, childSpender: null, isFamilyScreen: false, familyScreenFamily: null, authError: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, socialLogin, childLogin, familyScreenLogin, logout }}>
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
