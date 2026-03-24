import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const TOKEN_KEY = 'auth_token';

/**
 * When true, 401 responses will NOT auto-clear the stored token.
 * Used during boot when we probe multiple auth endpoints.
 */
export let suppressAutoClear = false;

export const api = axios.create({
  baseURL: Constants.expoConfig?.extra?.apiUrl ?? process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost/api/v1',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// Inject Bearer token on every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear stored token (auth context will handle navigation)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !suppressAutoClear) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
    return Promise.reject(error);
  },
);

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
