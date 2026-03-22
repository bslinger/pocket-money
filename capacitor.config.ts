import type { CapacitorConfig } from '@capacitor/cli';

const isProd = process.env.NODE_ENV === 'production';

const config: CapacitorConfig = {
  appId: 'com.quiddo.app',
  appName: 'Quiddo',
  webDir: 'public',
  server: isProd
    ? undefined
    : {
        url: 'https://quiddo-main-5m5iax.laravel.cloud/login',
        cleartext: true,
      },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 0,
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#2D6A4F',
    },
  },
  ios: {
    allowsBackForwardNavigationGestures: true,
  },
};

export default config;
