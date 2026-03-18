import type { CapacitorConfig } from '@capacitor/cli';

const isProd = process.env.NODE_ENV === 'production';

const config: CapacitorConfig = {
  appId: 'com.pocketmoney.app',
  appName: 'Pocket Money',
  webDir: 'public',
  server: isProd
    ? undefined  // uses bundled assets in prod
    : {
        url: 'http://pocket-money.lndo.site',
        cleartext: true,
      },
};

export default config;
