import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zainussunna.zls',
  appName: 'ZLS',
  webDir: 'dist',
  server: {
    url: 'https://accounts.zainussunnaacademy.com',
    cleartext: true
  }
};

export default config;
