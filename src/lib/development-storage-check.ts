import type { SupabaseClient } from '@supabase/supabase-js';

export const storageCheckAccounts = ['1b0ea76e-a629-4f54-8ec5-1e4ae0e7a251',
  'f6a4f8e9-891f-4598-adaf-a30016f47b35', '46dcc41c-5405-41b2-9be3-251089480809',
  '8bd9e1e8-4079-48b7-8cae-3a3c0176dfc8'];
export function storageCheckAllowed(dev: boolean, hostname: string, project: string | undefined, owner: string) {
  return dev && ['127.0.0.1', 'localhost'].includes(hostname)
    && project === 'https://akiksrlzdqvipqbbjxpw.supabase.co' && storageCheckAccounts.includes(owner);
}

// Fixed disposable fixture only: installed pending-review guard verification.
// The operator reserves its job server-side with provider dispatch disabled.
export async function runDevelopmentScanStorageCheck(client: SupabaseClient,
  config: { dev: boolean; hostname: string; project?: string }, report: (text: string) => void) {
  const {data,error}=await client.auth.getUser();
  const owner='8bd9e1e8-4079-48b7-8cae-3a3c0176dfc8';
  if(error||data.user?.id!==owner||!data.user.email_confirmed_at||data.user.is_anonymous
    ||!storageCheckAllowed(config.dev,config.hostname,config.project,owner))
    throw new Error('Designated disposable scan account on development localhost required.');
  const id='83a0552a-032e-439a-b166-087c4f9875a2';
  const path=owner+'/56bfb87a-c362-4294-ae6b-05fcb3c58f0d.jpg';
  const reference=config.project+'/storage/v1/object/public/media/'+path;
  const post=await client.from('posts').select('user_id,image_url,is_published').eq('id',id).single();
  if(post.error||post.data?.user_id!==owner||post.data.image_url!==reference||post.data.is_published!==true)
    throw new Error('Exact disposable public-photo fixture required.');
  const storage=client.storage.from('media');
  const read=()=>storage.download(path,{cacheNonce:crypto.randomUUID()},{cache:'no-store'});
  const digest=async(blob:Blob)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))).join(',');
  const before=await read();
  if(before.error||!before.data)throw new Error('Fixture download failed.');
  const expected=await digest(before.data);
  const results=await Promise.allSettled([
    storage.upload(path,before.data,{upsert:true,contentType:'image/jpeg'}),
    storage.remove([path]),
  ]);
  if(results.some(result=>result.status==='rejected'))
    throw new Error('Storage transport failed; lock enforcement is unverified.');
  const after=await read();
  if(after.error||!after.data||await digest(after.data)!==expected)
    throw new Error('Locked fixture bytes changed or disappeared; scanning must stay disabled.');
  let storageUnverified='';
  if(results.some(result=>result.status==='fulfilled'&&(!result.value.error
    || !result.value.error.message.includes('Photo review in progress')))) {
    const outcomes=results.map((result,index)=>{
      const label=index===0?'upsert':'delete';
      if(result.status!=='fulfilled')return label+': transport failure';
      const error=result.value.error;
      if(!error)return label+': no API error';
      const value=error as typeof error & {status?:number;statusCode?:string;code?:string};
      const status=String(value.status??value.statusCode??'unknown');
      const code=String(value.code??'unknown');
      return label+': HTTP '+(/^\d{3}$/.test(status)?status:'unknown')
        +', code '+(/^[A-Za-z0-9_]{1,40}$/.test(code)?code:'unknown');
    });
    storageUnverified='Explicit pending-review Storage refusal required; lock enforcement is unverified. '
      +outcomes.join('; ')+'. Fresh fixture bytes are unchanged. Independent server correlation required.';
  }
  if(!storageUnverified)report('PASS: concurrent Storage upsert/delete refused; fresh download SHA-256 unchanged.');
  const privacy=await client.from('posts').update({is_published:false}).eq('id',id).select('id');
  if(privacy.error?.code!=='55000'||!privacy.error.message.includes('Photo review in progress'))
    throw new Error('Explicit pending-review privacy refusal required; lock enforcement is unverified.');
  const retained=await client.from('posts').select('is_published').eq('id',id).single();
  if(retained.error||retained.data?.is_published!==true)throw new Error('Pending snapshot changed.');
  report('PASS: pending snapshot privacy change refused and public state preserved.');
  if(storageUnverified)throw new Error(storageUnverified);
  report('This verifies a controlled pending lock, not an actual outbound Azure worker or account deletion.');
}
// Normal caller-scoped Storage APIs only. Never accept arbitrary paths or keys.
// Each run touches only its newly generated prefix; no posts are created.
export async function runDevelopmentStorageCheck(client: SupabaseClient, fixture: Blob,
  config: { dev: boolean; hostname: string; project?: string }, report: (text: string) => void) {
  const { data, error } = await client.auth.getUser();
  const owner = data.user?.id ?? '';
  if (error || !data.user?.email_confirmed_at || data.user.is_anonymous
    || !storageCheckAllowed(config.dev, config.hostname, config.project, owner)) {
    throw new Error('Confirmed designated development account on localhost required.');
  }
  if (fixture.type !== 'image/png' || fixture.size < 8 || fixture.size > 1024 * 1024) {
    throw new Error('Bounded repository PNG fixture required.');
  }
  const bytes = new Uint8Array(await fixture.arrayBuffer());
  if (![137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v)) throw new Error('PNG fixture invalid.');
  const prefix = owner + '/clipt-verification-' + crypto.randomUUID();
  const paths = [0,1,2].map(index => prefix + '/concurrent-' + index + '.png');
  const storage = client.storage.from('media');
  const downloadFresh = (path: string) => storage.download(path, { cacheNonce: crypto.randomUUID() }, { cache: 'no-store' });
  const digest = async (blob: Blob) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()))).join(',');
  report('Fixture prefix: ' + prefix);
  let failure: unknown;
  // Wait for every in-flight request before cleanup, even on transport rejection.
  // Promise.all alone can remove a prefix while a slower upload recreates it.
  const uploads = async (requests: ReturnType<typeof storage.upload>[]) => {
    const settled = await Promise.allSettled(requests);
    return settled.map(result => result.status === 'fulfilled'
      ? result.value : { error: { message: 'Upload transport failed' } });
  };
  try {
    const independent = await uploads(paths.map(path => storage.upload(path, fixture, { upsert: false, contentType: 'image/png' })));
    if (independent.some(result => result.error)) throw new Error('Concurrent independent uploads failed.');
    report('PASS: three simultaneous independent uploads.');
    const duplicatePath = prefix + '/duplicate.png'; paths.push(duplicatePath);
    const duplicates = await uploads([0,1].map(() => storage.upload(duplicatePath, fixture, { upsert: false, contentType: 'image/png' })));
    if (duplicates.filter(result => !result.error).length !== 1) throw new Error('Duplicate upload did not have exactly one winner.');
    report('PASS: simultaneous duplicate requests have exactly one winner.');
    const downloaded = await Promise.all(paths.map(path => downloadFresh(path)));
    const expected = await digest(fixture);
    if (downloaded.some(result => result.error || !result.data)
      || (await Promise.all(downloaded.map(result => digest(result.data!)))).some(value => value !== expected)) {
      throw new Error('Owner downloads differ from uploaded bytes.');
    }
    report('PASS: all owner downloads match the fixture SHA-256.');
    const replaced = await uploads(paths.slice(0,2).map(path => storage.upload(path, fixture, { upsert: true, contentType: 'image/png' })));
    if (replaced.some(result => result.error)) throw new Error('Owner concurrent replacement failed.');
    report('PASS: concurrent owner upserts.');
    const foreignPath = '46dcc41c-5405-41b2-9be3-251089480809/2bec2f7d-094a-42cb-b3c0-3faf4a29557f.jpg';
    if (owner !== storageCheckAccounts[2]) {
      const foreign = await downloadFresh(foreignPath);
      if (!foreign.error || foreign.data) throw new Error('Foreign private media returned bytes.');
      report('PASS: known other-account private photo denied through authenticated Storage API.');
    } else report('NOT TESTED: foreign fixture belongs to this signed-in account.');
  } catch (cause) { failure = cause; }
    // Exact run-local targets, including paths whose upload response failed.
    const removed = await storage.remove(paths);
    if (removed.error) throw new Error('Fixture cleanup failed; preserve the displayed prefix for cleanup.');
    const listing = await storage.list(prefix, { limit: 10 });
    if (listing.error || listing.data.length) throw new Error('Fixture cleanup could not be confirmed.');
    const missing = await downloadFresh(paths[0]);
    if (!missing.error || missing.data) throw new Error('Deleted fixture is still downloadable.');
    report('PASS: exact-prefix cleanup, empty listing and deleted-object download denial.');
  if (failure) throw failure;
}
