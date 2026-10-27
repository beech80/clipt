import { useEffect, useState } from 'react';
import { readControllerPreferences, type ControllerPreferences } from '@/lib/controller-layout';
const KEY = 'clipt-controller-preferences-v1';
const EVENT = 'clipt:controller-preferences';
function read() { try { return readControllerPreferences(localStorage.getItem(KEY)); } catch { return readControllerPreferences(null); } }
export function useControllerPreferences() {
  const [preferences, setPreferences] = useState(read);
  const [saved, setSaved] = useState(true);
  useEffect(() => {
    const sync = (event: Event) => setPreferences(event instanceof CustomEvent ? event.detail : read());
    window.addEventListener('storage', sync); window.addEventListener(EVENT, sync);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener(EVENT, sync); };
  }, []);
  function update(next: ControllerPreferences) {
    setPreferences(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); setSaved(true); }
    catch { setSaved(false); }
    window.dispatchEvent(new CustomEvent(EVENT,{detail:next}));
  }
  return { preferences, update, saved };
}
