import type { CapacitorConfig } from '@capacitor/cli';

// Native code must be reachable only from the reviewed, bundled application.
// Preserve the existing application identifier; never load an old remote builder
// site into a WebView that can invoke privileged capture plugins.
const config: CapacitorConfig = {
  appId: 'com.slnjliheyiiummxhrgmk.clip',
  appName: 'CLIPT',
  webDir: 'dist',
  loggingBehavior: 'none',
  zoomEnabled: true,
  server: { androidScheme: 'https', cleartext: false },
  ios: { contentInset: 'automatic', backgroundColor: '#1A1F2C' },
  android: { backgroundColor: '#1A1F2C', allowMixedContent: false },
};

export default config;
