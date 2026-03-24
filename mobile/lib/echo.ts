import Echo from 'laravel-echo';
import Pusher from 'pusher-js/react-native';
import Constants from 'expo-constants';
import { getToken } from './api';

let echoInstance: Echo<'reverb'> | null = null;

const API_URL = Constants.expoConfig?.extra?.apiUrl
  ?? process.env.EXPO_PUBLIC_API_URL
  ?? 'http://localhost/api/v1';

// Strip /api/v1 to get the base URL for broadcasting auth
const BASE_URL = API_URL.replace(/\/api\/v1\/?$/, '');

export function getEcho(isChildDevice: boolean): Echo<'reverb'> {
  if (echoInstance) return echoInstance;

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: process.env.EXPO_PUBLIC_REVERB_APP_KEY ?? 'quiddo-key',
    wsHost: process.env.EXPO_PUBLIC_REVERB_HOST ?? 'localhost',
    wsPort: Number(process.env.EXPO_PUBLIC_REVERB_PORT ?? 8080),
    wssPort: Number(process.env.EXPO_PUBLIC_REVERB_PORT ?? 443),
    forceTLS: (process.env.EXPO_PUBLIC_REVERB_SCHEME ?? 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    Pusher,
    authorizer: (channel: any) => ({
      authorize: async (socketId: string, callback: (error: any, data: any) => void) => {
        try {
          const token = await getToken();
          const endpoint = isChildDevice
            ? `${API_URL}/child/broadcasting/auth`
            : `${API_URL}/broadcasting/auth`;

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              socket_id: socketId,
              channel_name: channel.name,
            }),
          });

          const data = await response.json();
          callback(null, data);
        } catch (error) {
          callback(error, null);
        }
      },
    }),
  });

  return echoInstance;
}

export function disconnectEcho(): void {
  echoInstance?.disconnect();
  echoInstance = null;
}
