import type { CapacitorConfig } from '@capacitor/cli';

const isProd = process.env.NODE_ENV === 'production';

const config: CapacitorConfig = {
  appId: 'com.quiddo.app',
  appName: 'Quiddo',
  webDir: 'public',
  server: isProd
    ? undefined  // uses bundled assets in prod
    : {
        url: 'https://quiddo-main-5m5iax.laravel.cloud/',
        cleartext: true,
      },
  ios: {
    // Allow swipe-back gesture to navigate browser history instead of exiting
    allowsBackForwardNavigationGestures: true,
  },
};

export default config;
