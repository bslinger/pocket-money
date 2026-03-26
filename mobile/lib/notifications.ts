import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { api } from './api';
import { queryClient } from './queryClient';

/** True when running inside Expo Go (push not available since SDK 53). */
const isExpoGo = Constants.appOwnership === 'expo';

/** Lazy-loaded expo-notifications module (null in Expo Go). */
let Notifications: typeof import('expo-notifications') | null = null;

async function getNotifications() {
  if (isExpoGo) return null;
  if (!Notifications) {
    try {
      Notifications = await import('expo-notifications');
    } catch {
      return null;
    }
  }
  return Notifications;
}

// Configure foreground notification behaviour (async, best-effort)
(async () => {
  const N = await getNotifications();
  if (!N) return;
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
})();

/**
 * Request permission and register the device's native push token with the backend.
 */
export async function registerForPushNotifications(isChildDevice: boolean): Promise<void> {
  const N = await getNotifications();
  if (!N) return;

  try {
    const { status: existing } = await N.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await N.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return;
    }

    const tokenData = await N.getDevicePushTokenAsync();
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    const endpoint = isChildDevice ? '/child/device-tokens' : '/device-tokens';

    await api.post(endpoint, {
      token: tokenData.data,
      platform,
    });
  } catch (error) {
    console.warn('Failed to register push token:', error);
  }
}

/**
 * Unregister the device's push token from the backend.
 */
export async function unregisterPushToken(isChildDevice: boolean): Promise<void> {
  const N = await getNotifications();
  if (!N) return;

  try {
    const tokenData = await N.getDevicePushTokenAsync();
    const endpoint = isChildDevice ? '/child/device-tokens' : '/device-tokens';

    await api.delete(endpoint, {
      data: { token: tokenData.data },
    });
  } catch (error) {
    console.warn('Failed to unregister push token:', error);
  }
}

// Deep link mapping from notification data to Expo Router paths
const DEEP_LINK_MAP: Record<string, string> = {
  'quiddo://chores': '/(app)/(tabs)/chores',
  'quiddo://goals': '/(app)/(tabs)/goals',
  'quiddo://kids': '/(app)/(tabs)/kids',
  'quiddo://': '/(app)/(tabs)',
};

function resolveDeepLink(deepLink: string): { path: string; params?: Record<string, string> } {
  const [base, queryString] = deepLink.split('?');
  const routerPath = DEEP_LINK_MAP[base] ?? DEEP_LINK_MAP['quiddo://'] ?? '/(app)/(tabs)';
  const params: Record<string, string> = {};
  if (queryString) {
    for (const part of queryString.split('&')) {
      const [key, value] = part.split('=');
      if (key && value) params[key] = decodeURIComponent(value);
    }
  }
  return { path: routerPath, params: Object.keys(params).length > 0 ? params : undefined };
}

/**
 * Hook that sets up notification listeners for foreground display and tap-to-navigate.
 * No-op in Expo Go.
 */
export function useNotificationListeners(): void {
  const router = useRouter();
  const responseListener = useRef<any>(null);
  const receivedListener = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const N = await getNotifications();
      if (!N || !mounted) return;

      receivedListener.current = N.addNotificationReceivedListener(() => {
        queryClient.invalidateQueries();
      });

      responseListener.current = N.addNotificationResponseReceivedListener((response) => {
        const deepLink = response.notification.request.content.data?.deep_link as string | undefined;
        if (deepLink) {
          const { path, params } = resolveDeepLink(deepLink);
          if (params) {
            router.push({ pathname: path as any, params });
          } else {
            router.push(path as any);
          }
        }
      });
    })();

    return () => {
      mounted = false;
      if (receivedListener.current) {
        receivedListener.current?.remove();
      }
      if (responseListener.current) {
        responseListener.current?.remove();
      }
    };
  }, []);
}
