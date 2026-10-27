import type {SupabaseClient} from '@supabase/supabase-js';

export const automaticPhotoFixture={
 owner:'ad6774a8-62f8-4b5e-8c2a-b9e446bbff7a',
 post:'33feb136-0043-40f4-abfa-2b6ede0bf301',
 project:'https://akiksrlzdqvipqbbjxpw.supabase.co',
};
export function fixtureMedia(reference:unknown) {
 if(typeof reference!=='string')throw new Error('Exact fixture photo unavailable.');
 const url=new URL(reference),match=url.pathname.match(/^\/storage\/v1\/object\/(?:public|authenticated)\/(media|posts)\/(.+)$/);
 if(url.origin!==automaticPhotoFixture.project||url.username||url.password||url.search||url.hash||!match
  ||!match[2].startsWith(automaticPhotoFixture.owner+'/')||match[2].split('/').some(part=>part==='.'||part==='..'||part.includes('%')))
  throw new Error('Canonical owned development fixture required.');
 return {bucket:match[1],path:match[2]};
}
export async function runAutomaticPhotoStorageCheck(client:SupabaseClient,config:{project?:string;stage?:string},
 report:(message:string)=>void) {
 if(config.project!==automaticPhotoFixture.project||!['development','staging'].includes(config.stage??''))
  throw new Error('Development project only.');
 const identity=await client.auth.getUser();
 if(identity.error||identity.data.user?.id!==automaticPhotoFixture.owner||!identity.data.user.email_confirmed_at||identity.data.user.is_anonymous)
  throw new Error('Sign in to the approved disposable development account.');
 const post=await client.from('posts').select('id,user_id,is_published,image_url,video_url').eq('id',automaticPhotoFixture.post)
  .eq('user_id',automaticPhotoFixture.owner).single();
 if(post.error||!post.data||post.data.id!==automaticPhotoFixture.post||post.data.user_id!==automaticPhotoFixture.owner
  ||post.data.is_published!==true||post.data.video_url!==null)
  throw new Error('Exact published fixture unavailable.');
 const holds=await client.rpc('my_photo_review_holds');
 if(holds.error||!Array.isArray(holds.data)||!holds.data.some(row=>row.post_id===automaticPhotoFixture.post&&row.state==='processing'))
  throw new Error('Processing hold not confirmed. Do not run mutation checks yet.');
 const {bucket,path}=fixtureMedia(post.data.image_url),storage=client.storage.from(bucket);
 const read=()=>storage.download(path,{cacheNonce:crypto.randomUUID()},{cache:'no-store'});
 const digest=async(blob:Blob)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())))
  .map(value=>value.toString(16).padStart(2,'0')).join('');
 const before=await read();
 if(before.error||!before.data||before.data.size<1||before.data.size>4*1024*1024||!['image/jpeg','image/png'].includes(before.data.type))
  throw new Error('Bounded owner JPEG/PNG download required.');
 const expected=await digest(before.data);
 // No tokens, files, or private content are persisted. Preserve only a run marker
 // so refreshing cannot silently repeat destructive diagnostic requests.
 const key='clipt.automatic-photo-storage.v1.'+automaticPhotoFixture.post;
 if(sessionStorage.getItem(key))throw new Error('This fixture check was already attempted. Send its result; do not rerun.');
 sessionStorage.setItem(key,'started');
 report('Processing fixture: '+automaticPhotoFixture.post);
 const attempts=await Promise.allSettled([
  storage.upload(path,before.data,{upsert:true,contentType:before.data.type}),storage.remove([path]),
 ]);
 const after=await read();
 if(after.error||!after.data||await digest(after.data)!==expected)
  throw new Error('FAIL: fixture bytes changed or disappeared. Stop; do not scan or delete the account.');
 report('PASS: fresh owner download SHA-256 unchanged after simultaneous upsert/delete attempts.');
 let exact=true;
 for(const [index,result] of attempts.entries()) {
  const label=index===0?'upsert':'delete';
  if(result.status==='rejected') {exact=false;report('UNVERIFIED: '+label+' transport failed.');continue;}
  const failure=result.value.error;
  if(!failure)throw new Error('FAIL: '+label+' was accepted during the processing hold.');
  const code=String((failure as {statusCode?:string;status?:number;code?:string}).statusCode
   ??(failure as {status?:number}).status??'unknown');
  const explicit=/Photo review in progress|Reviewed photo media is immutable/.test(failure.message);
  if(!explicit)exact=false;
  report((explicit?'PASS: ':'UNVERIFIED: ')+label+' refused'+(/^\d{3}$/.test(code)?' (HTTP '+code+')':'')
   +(explicit?'.':' — independent server error correlation required.'));
 }
 sessionStorage.setItem(key,exact?'explicit-denials':'requires-server-correlation');
 report('No Azure request or account deletion was performed. Do not rerun this check.');
}
