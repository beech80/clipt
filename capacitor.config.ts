import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.slnjliheyiiummxhrgmk.clip',
  appName: 'Clip',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    // Use production URL for production builds
    url: process.env.NODE_ENV === 'production' 
      ? undefined 
      : 'https://slnjliheyiiummxhrgmk.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#1A1F2C',
    limitsNavigationsToAppBoundDomains: true
  },
  android: {
    contentInset: 'automatic',
    backgroundColor: '#1A1F2C'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#1A1F2C",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;