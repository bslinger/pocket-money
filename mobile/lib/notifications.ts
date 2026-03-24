import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { api } from './api';

// Configure foreground notification behaviour
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request permission and register the device's native push token with the backend.
 */
export async function registerForPushNotifications(isChildDevice: boolean): Promise<void> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return;
    }

    // Get the native device token (FCM for Android, APNs for iOS)
    const tokenData = await Notifications.getDevicePushTokenAsync();
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
  try {
    const tokenData = await Notifications.getDevicePushTokenAsync();
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

/**
 * Hook that sets up notification listeners for foreground display and tap-to-navigate.
 */
export function useNotificationListeners(): void {
  const router = useRouter();
  const queryClient = useQueryClient();
  const responseListener = useRef<Notifications.EventSubscription>();
  const receivedListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    // Foreground: invalidate query caches so the UI refreshes
    receivedListener.current = Notifications.addNotificationReceivedListener(() => {
      queryClient.invalidateQueries();
    });

    // Tap: navigate to the relevant screen
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const deepLink = response.notification.request.content.data?.deep_link as string | undefined;
      if (deepLink) {
        const routerPath = DEEP_LINK_MAP[deepLink] ?? DEEP_LINK_MAP['quiddo://'];
        if (routerPath) {
          router.push(routerPath as any);
        }
      }
    });

    return () => {
      if (receivedListener.current) {
        Notifications.removeNotificationSubscription(receivedListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);
}
