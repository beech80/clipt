export const BACKUP_AUDIENCE='clipt-recurring-private-media-backup-v1';
export const GITHUB_ISSUER='https://token.actions.githubusercontent.com';
export const BACKUP_WORKFLOW='beech80/clipt/.github/workflows/clipt-private-media-recurring.yml@refs/heads/main';
const decode=s=>Uint8Array.from(atob(s.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
async function textBounded(response,max){
 if(!response.ok)throw Error('backup-authorization-denied');
 const reader=response.body?.getReader();if(!reader)throw Error('backup-authorization-denied');
 const chunks=[];let total=0;try{for(;;){const {value,done}=await reader.read();if(done)break;total+=value.length;if(total>max)throw Error('backup-authorization-denied');chunks.push(value);}}catch(e){await reader.cancel();throw e;}
 const all=new Uint8Array(total);let n=0;for(const c of chunks){all.set(c,n);n+=c.length;}return new TextDecoder().decode(all);
}
export async function sha256Text(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function verifyBackupOidc(token,{now=Date.now(),fetchImpl=fetch}={}){
 if(typeof token!=='string'||token.length>16000)throw Error('backup-authorization-denied');
 const p=token.split('.');if(p.length!==3)throw Error('backup-authorization-denied');
 let h,c;try{h=JSON.parse(new TextDecoder().decode(decode(p[0])));c=JSON.parse(new TextDecoder().decode(decode(p[1])));}catch{throw Error('backup-authorization-denied');}
 const seconds=Math.floor(now/1000);
 if(h.alg!=='RS256'||typeof h.kid!=='string'||!h.kid||h.kid.length>200||h.jku||h.jwk||h.x5u
 ||c.iss!==GITHUB_ISSUER||c.aud!==BACKUP_AUDIENCE||c.repository!=='beech80/clipt'||c.repository_id!=='917757980'||c.repository_owner_id!=='195324952'
 ||c.ref!=='refs/heads/main'||!['schedule','workflow_dispatch','push'].includes(c.event_name)
 ||c.workflow_ref!==BACKUP_WORKFLOW||!/^[a-f0-9]{40}$/.test(c.sha||'')||!/^[a-f0-9]{40}$/.test(c.workflow_sha||'')
 ||!['repo:beech80/clipt:ref:refs/heads/main','repo:beech80@195324952/clipt@917757980:ref:refs/heads/main'].includes(c.sub)||c.runner_environment!=='github-hosted'
 ||!/^[1-9][0-9]{0,19}$/.test(c.run_id||'')||!/^[1-9][0-9]{0,4}$/.test(c.run_attempt||'')
 ||!Number.isInteger(c.exp)||!Number.isInteger(c.iat)||!Number.isInteger(c.nbf)||c.exp<=seconds||c.exp<=c.iat||c.exp-c.iat>600||c.iat>seconds+30||c.iat<seconds-600||c.nbf>seconds+30)throw Error('backup-authorization-denied');
 const response=await fetchImpl(GITHUB_ISSUER+'/.well-known/jwks',{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(10000)});
 const jwks=JSON.parse(await textBounded(response,100000));
 if(!Array.isArray(jwks.keys)||jwks.keys.length>25)throw Error('backup-authorization-denied');
 const keys=jwks.keys.filter(k=>k.kid===h.kid&&k.kty==='RSA'&&(!k.alg||k.alg==='RS256')&&(!k.use||k.use==='sig')&&typeof k.n==='string'&&decode(k.n).length>=256);
 if(keys.length!==1)throw Error('backup-authorization-denied');
 const key=await crypto.subtle.importKey('jwk',keys[0],{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(p[2]),new TextEncoder().encode(p[0]+'.'+p[1])))throw Error('backup-authorization-denied');
 return c;
}
export async function attestBackupRunner(claims,reviewedFiles,{fetchImpl=fetch}={}){
 const files=Object.entries(reviewedFiles||{});if(files.length<5||files.length>12)throw Error('backup-runner-not-reviewed');
 for(const [path,digest]of files){
  if(!/^(?:scripts|supabase\/functions\/_shared|\.github\/workflows)\/[A-Za-z0-9_./-]+$/.test(path)||path.split('/').some(p=>p==='..'||!p)||!/^[a-f0-9]{64}$/.test(digest))throw Error('backup-runner-not-reviewed');
 }
 await Promise.all(files.map(async([path,digest])=>{
  const response=await fetchImpl('https://raw.githubusercontent.com/beech80/clipt/'+(path.startsWith('.github/workflows/')?claims.workflow_sha:claims.sha)+'/'+path,{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(await sha256Text(await textBounded(response,200000))!==digest)throw Error('backup-runner-not-reviewed');
 }));
 return true;
}
