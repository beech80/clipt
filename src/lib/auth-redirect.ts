import { Capacitor } from '@capacitor/core';

const nativeWebOrigin = 'https://clipt-media-only.vercel.app';

/**
 * Email clients cannot open Capacitor's private capacitor://localhost origin.
 * Native builds therefore send confirmation and recovery links to the reviewed
 * HTTPS app, while ordinary browser builds retain their current origin.
 */
export function authRedirect(path: '/login' | '/update-password'): string {
  const origin = Capacitor.isNativePlatform() ? nativeWebOrigin : window.location.origin;
  return new URL(path, origin).href;
}
