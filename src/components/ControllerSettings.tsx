import { useControllerPreferences } from '@/hooks/useControllerPreferences';
export function ControllerSettings() {
  const {preferences, update, saved} = useControllerPreferences();
  return <div className="space-y-3 min-w-0">
    <label className="block" htmlFor="controller-layout">Controller layout</label>
    <select id="controller-layout" className="w-full min-h-11 rounded-lg border border-violet-400 bg-[#171126] p-2 text-white"
      value={preferences.layout} onChange={event => update({...preferences, layout: event.target.value as typeof preferences.layout})}>
      <option value="auto">Auto (recommended)</option><option value="classic">Classic</option><option value="immersive">Immersive</option>
    </select>
    <label className="flex items-center gap-3 min-h-11"><input type="checkbox" checked={preferences.autoHide}
      onChange={event => update({...preferences,autoHide:event.target.checked})} /> Auto-Hide Controller</label>
    <p className="text-sm">{preferences.autoHide ? 'On — Hide after 10 seconds' : 'Off — Keep controller visible'}</p>
    <p className="text-sm">Portrait viewing uses floating controls at every zoom level. Controller layout selects the landscape presentation. Change Hand Preference in Accessibility or the CLIPT navigation panel.</p>
    <p className="text-sm">Saved on this browser. Landscape Classic uses the accessible immersive fallback when it cannot fit safely. Use Show controls or tap the media to restore hidden controls.</p>
    {!saved && <p role="status">Browser storage is unavailable; this preference applies for this session only.</p>}
  </div>;
}
