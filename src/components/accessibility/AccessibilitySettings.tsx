import {useRef,useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {Card} from '@/components/ui/card';
import {Switch} from '@/components/ui/switch';
import {Label} from '@/components/ui/label';
import {Button} from '@/components/ui/button';
import {supabase} from '@/lib/supabase';
import {useAuth} from '@/contexts/AuthContext';
import {useAccessibilityPreferences} from '@/hooks/useAccessibilityPreferences';
import {HandPreferenceSettings} from './HandPreferenceSettings';

export function AccessibilitySettings(){
  const {user}=useAuth();const query=useAccessibilityPreferences();const cache=useQueryClient();
  const lock=useRef(false);const [busy,setBusy]=useState(false);const [notice,setNotice]=useState('');const [error,setError]=useState('');
  async function update(key:'high_contrast'|'reduced_motion',value:boolean){
    if(!user||lock.current||query.isError||query.isPending)return;
    lock.current=true;setBusy(true);setError('');setNotice('');
    try{
      const {data,error:saveError}=await supabase.from('accessibility_settings').upsert({
        user_id:user.id,high_contrast:key==='high_contrast'?value:query.data?.high_contrast??false,reduced_motion:key==='reduced_motion'?value:query.data?.reduced_motion??false,
        screen_reader_enabled:query.data?.screen_reader_enabled??false,caption_size:query.data?.caption_size??'medium',
      },{onConflict:'user_id'}).select('*').single().retry(false);
      if(saveError)throw saveError;
      cache.setQueryData(['accessibility-preferences',user.id],data);setNotice('Accessibility preference saved.');
    }catch{setError('Preference was not confirmed. Reload settings before retrying.');await query.refetch();}
    finally{lock.current=false;setBusy(false);}
  }
  return <Card className="p-6 space-y-4">
    <h2 className="text-xl font-semibold">Accessibility Settings</h2>
    <HandPreferenceSettings />
    {query.isPending?<p role="status">Loading accessibility preferences…</p>:query.isError?<><p role="alert">Accessibility preferences are unavailable.</p><Button onClick={()=>void query.refetch()}>Retry preferences</Button></>:<>
      <div className="flex justify-between items-center gap-4"><Label htmlFor="high-contrast">High Contrast</Label><Switch id="high-contrast" disabled={busy} checked={Boolean(query.data?.high_contrast)} onCheckedChange={v=>void update('high_contrast',v)}/></div>
      <div className="flex justify-between items-center gap-4"><Label htmlFor="reduced-motion">Reduced Motion</Label><Switch id="reduced-motion" disabled={busy} checked={Boolean(query.data?.reduced_motion)} onCheckedChange={v=>void update('reduced_motion',v)}/></div>
      <p className="text-sm text-muted-foreground">Saved preferences apply across pages. Your device's reduced-motion preference is also respected.</p>
    </>}
    {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
    <p className="text-sm text-muted-foreground">Use your device's screen reader; it does not need an in-app switch. Video caption generation and caption-size controls are not available yet.</p>
  </Card>;
}
