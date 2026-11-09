import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { isNativeApp } from './runtime';
import { createAuthLinkConsumer } from './auth-links';

/** Cold/warm auth links and lifecycle only; no native code runs in the web beta. */
export default function NativeAppLifecycle() {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);
  useEffect(() => {
    if (!isNativeApp()) return;
    let disposed = false;
    const handles: PluginListenerHandle[] = [];
    const register = async (value: Promise<PluginListenerHandle>) => {
      const handle = await value;
      if (disposed) await handle.remove(); else handles.push(handle);
    };
    const consume = createAuthLinkConsumer(code => disposed
      ? Promise.resolve({ error: true }) : supabase.auth.exchangeCodeForSession(code),
    path => { if (!disposed) navigateRef.current(path, { replace: true }); },
    () => { if (!disposed) {
      toast.error('This sign-in link could not be verified. Request a new link in this app and open it on this device.');
      navigateRef.current('/login', { replace: true });
    } });
    const activity = (active: boolean) => {
      if (disposed) return;
      if (active) void supabase.auth.startAutoRefresh();
      else {
        void supabase.auth.stopAutoRefresh();
        // Background audio is not a capability of the first App Store release.
        document.querySelectorAll('video, audio').forEach(node => (node as HTMLMediaElement).pause());
      }
    };
    void (async () => {
      try {
        await register(App.addListener('appUrlOpen', event => { void consume(event.url); }));
        await register(App.addListener('appStateChange', event => activity(event.isActive)));
        const state = await App.getState();
        activity(state.isActive);
        const launch = await App.getLaunchUrl();
        if (!disposed && launch?.url) await consume(launch.url);
      } catch {
        if (!disposed) toast.error('The app connection could not start. Close and reopen CLIPT.');
      }
    })();
    return () => {
      disposed = true;
      handles.forEach(handle => { void handle.remove(); });
      void supabase.auth.stopAutoRefresh();
    };
  }, []);
  return null;
}
