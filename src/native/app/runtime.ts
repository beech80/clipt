import { Capacitor } from '@capacitor/core';
export const isNativeApp = () => Capacitor.isNativePlatform();
export const isAppStoreBuild = () => isNativeApp() && import.meta.env.VITE_NATIVE_RELEASE === 'app-store';
