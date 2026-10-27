import { useEffect, useState } from 'react';
import { MOBILE_CONTROLS_EVENT, MOBILE_CONTROLS_KEY, readMobileControls, type MobileControlsPreferences } from '@/lib/mobile-controls';

function read() {
  try { return readMobileControls(localStorage.getItem(MOBILE_CONTROLS_KEY)); }
  catch { return readMobileControls(null); }
}

/** Device-local, like existing controller preferences; never writes account data. */
export function useMobileControlsPreferences() {
  const [preferences, setPreferences] = useState(read);
  const [saved, setSaved] = useState(true);
  useEffect(() => {
    const sync = (event: Event) => setPreferences(event instanceof CustomEvent ? readMobileControls(JSON.stringify(event.detail)) : read());
    const storage = (event: StorageEvent) => { if (!event.key || event.key === MOBILE_CONTROLS_KEY) setPreferences(read()); };
    window.addEventListener('storage', storage);
    window.addEventListener(MOBILE_CONTROLS_EVENT, sync);
    return () => { window.removeEventListener('storage', storage); window.removeEventListener(MOBILE_CONTROLS_EVENT, sync); };
  }, []);
  function update(patch: Partial<MobileControlsPreferences>) {
    // Read latest stored value to preserve the other preference across mounted consumers.
    let current = preferences;
    try { current = readMobileControls(localStorage.getItem(MOBILE_CONTROLS_KEY)); } catch { /* Retain the current session preference when storage is blocked. */ }
    const next = readMobileControls(JSON.stringify({ ...current, ...patch }));
    try {
      localStorage.setItem(MOBILE_CONTROLS_KEY, JSON.stringify(next));
      setSaved(true);
    } catch { setSaved(false); }
    setPreferences(next);
    window.dispatchEvent(new CustomEvent(MOBILE_CONTROLS_EVENT, { detail: next }));
  }
  return { preferences, saved, update };
}
