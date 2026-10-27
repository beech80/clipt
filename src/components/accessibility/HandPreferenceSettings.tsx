import { useId } from 'react';
import { useMobileControlsPreferences } from '@/hooks/useMobileControlsPreferences';

export function HandPreferenceSettings() {
  const { preferences, update, saved } = useMobileControlsPreferences();
  const id = useId();
  return <fieldset className="space-y-3 border border-purple-500/40 rounded-xl p-4">
    <legend className="px-2 font-semibold">Hand Preference</legend>
    <p id={id} className="text-sm text-muted-foreground">Moves controls, never the video or text. Saved on this device, not synced to your account.</p>
    <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Hand Preference" aria-describedby={id}>
      {(['right', 'left'] as const).map(hand => <label key={hand} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-purple-500/50 px-3">
        <input type="radio" name={id} value={hand} checked={preferences.hand === hand} onChange={() => update({ hand })} />
        {hand === 'right' ? 'Right-Handed' : 'Left-Handed'}
      </label>)}
    </div>
    <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={preferences.trail} onChange={event => update({ trail: event.target.checked })} />Purple swipe trail</label>
    <p className="text-sm text-muted-foreground">Swipe navigation remains available when the trail is off. Reduced motion also disables the trail.</p>
    {!saved && <p role="alert">This change could not be saved. Browser storage may be unavailable.</p>}
  </fieldset>;
}
