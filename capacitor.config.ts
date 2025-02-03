import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.slnjliheyiiummxhrgmk.clip',
  appName: 'Clip',
  webDir: 'dist',
  server: {
    url: 'https://slnjliheyiiummxhrgmk.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  ios: {
    contentInset: 'automatic'
  },
  android: {
    contentInset: 'automatic'
  }
};

export default config;