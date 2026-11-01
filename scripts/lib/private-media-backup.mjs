import {Buffer} from 'node:buffer';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,relative,basename} from 'node:path';
import {boundedBody,hash,BackupError} from './media-backup.mjs';
import {BACKUP_ENDPOINT,validatePrivateInventory,sourceIdentityHash,validateSignedSource} from '../../supabase/functions/_shared/private-backup-boundary.mjs';
import {BACKUP_AUDIENCE} from '../../supabase/functions/_shared/private-backup-oidc.mjs';
const fail=code=>{throw new BackupError(code);};
export function backupContext(env){
 if(env.GITHUB_REPOSITORY!=='beech80/clipt'||env.GITHUB_REF!=='refs/heads/main'||!['push','schedule','workflow_dispatch'].includes(env.GITHUB_EVENT_NAME)
 ||!/^[1-9][0-9]{0,19}$/.test(env.GITHUB_RUN_ID||'')||!/^[1-9][0-9]{0,4}$/.test(env.GITHUB_RUN_ATTEMPT||''))fail('private-backup-context-denied');
 return {runId:env.GITHUB_RUN_ID,runAttempt:env.GITHUB_RUN_ATTEMPT};
}
export function privateSourceClient(env,{fetchImpl=fetch,now=()=>Date.now()}={}){
 const context=backupContext(env);let token=null,until=0;
 let requestUrl;try{requestUrl=new URL(env.ACTIONS_ID_TOKEN_REQUEST_URL);}catch{fail('oidc-unavailable');}
 if(requestUrl.protocol!=='https:'||!/^([a-z0-9-]+\.)*actions\.githubusercontent\.com$/.test(requestUrl.hostname)||requestUrl.username||requestUrl.password||requestUrl.port||requestUrl.hash
 ||typeof env.ACTIONS_ID_TOKEN_REQUEST_TOKEN!=='string'||!env.ACTIONS_ID_TOKEN_REQUEST_TOKEN)fail('oidc-unavailable');
 const requestToken=env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;requestUrl.searchParams.set('audience',BACKUP_AUDIENCE);
 async function authorization(){
  if(token&&until>now())return token;
  const r=await fetchImpl(requestUrl.toString(),{headers:{Authorization:'Bearer '+requestToken},redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000)});
  const data=JSON.parse((await boundedBody(r,32000)).toString());
  if(typeof data.value!=='string'||data.value.length>16000)fail('oidc-unavailable');token=data.value;until=now()+120000;return token;
 }
 async function call(body){
  const r=await fetchImpl(BACKUP_ENDPOINT,{method:'POST',headers:{Authorization:'Bearer '+await authorization(),'Content-Type':'application/json'},body:JSON.stringify(body),redirect:'error',cache:'no-store',signal:AbortSignal.timeout(45000)});
  if(r.status===401){await r.body?.cancel();fail('private-source-authorization-denied');}
  if(r.status===409){await r.body?.cancel();fail('private-source-changed');}
  if(!r.ok){await r.body?.cancel();fail('private-source-request-failed');}
  return JSON.parse((await boundedBody(r,4_000_000)).toString());
 }
 return {
  async inventory(){const v=await call({action:'inventory'});if(v.runId!==context.runId||v.runAttempt!==context.runAttempt)fail('private-source-run-mismatch');try{return validatePrivateInventory(v);}catch{fail('private-inventory-invalid');}},
  async sign(o){const data=await call({action:'sign',id:o.id,identity:await sourceIdentityHash(o)});try{return validateSignedSource(data.url,o);}catch{fail('private-signed-url-rejected');}},
 };
}
export async function runPrivateBackup(inventory,client,source,{fetchImpl=fetch,progress=()=>{}}={}){
 try{validatePrivateInventory(inventory);}catch{fail('private-inventory-invalid');}
 if(!/^[1-9][0-9]{0,19}$/.test(inventory.runId||'')||!/^[1-9][0-9]{0,4}$/.test(inventory.runAttempt||''))fail('private-source-run-mismatch');
 const date=inventory.capturedAt.slice(0,10).replaceAll('-',''),snapshot=date+'-'+inventory.runId+'-'+inventory.runAttempt;
 if(!/^[0-9]{8}-[1-9][0-9]{0,19}-[1-9][0-9]{0,4}$/.test(snapshot))fail('private-snapshot-invalid');
 const root=resolve(await mkdtemp(join(tmpdir(),'clipt-private-restore-')));
 const manifest={...inventory,snapshotId:snapshot,files:[],restoreMethod:'isolated-temp-files-full-byte-sha256',noSourceMutations:true};
 const pooled=new Map();let copied=0,restoredBytes=0;
 try{
  for(let i=0;i<inventory.objects.length;i++){
   const o=inventory.objects[i];const url=validateSignedSource(await source.sign(o),o);
   const response=await fetchImpl(url,{redirect:'error',cache:'no-store',headers:{'Cache-Control':'no-cache','If-Match':'"'+o.metadata.eTag.replaceAll('"','')+'"'},signal:AbortSignal.timeout(120000)});
   const bytes=await boundedBody(response,o.metadata.size,'private-source-download');
   if(bytes.length!==o.metadata.size||response.headers.get('etag')?.replaceAll('"','').toLowerCase()!==o.metadata.eTag.replaceAll('"','').toLowerCase())fail('private-source-snapshot-changed');
   const sha256=hash(bytes),name='recurring/v1/objects/'+sha256;
   let saved=pooled.get(sha256);if(!saved){saved=await client.put(name,bytes);pooled.set(sha256,saved);}
   manifest.files.push({sourceId:o.id,fileName:name,fileId:saved.fileId,bucketId:saved.bucketId,contentLength:bytes.length,contentSha1:hash(bytes,'sha1'),sha256});
   copied+=bytes.length;if((i+1)%10===0||i+1===inventory.objects.length)progress({stage:'private-copy',completedFiles:i+1,totalFiles:inventory.objects.length,bytes:copied});
  }
  for(let i=0;i<manifest.files.length;i++){
   const file=manifest.files[i],bytes=await client.get(file,file.contentLength);
   if(bytes.length!==file.contentLength||hash(bytes)!==file.sha256)fail('private-restore-hash-mismatch');
   const target=join(root,String(i).padStart(4,'0'));await writeFile(target,bytes,{flag:'wx',mode:0o600});
   const restored=await readFile(target);if(restored.length!==file.contentLength||hash(restored)!==file.sha256)fail('private-restore-disk-mismatch');
   restoredBytes+=restored.length;if((i+1)%10===0||i+1===manifest.files.length)progress({stage:'private-restore',completedFiles:i+1,totalFiles:manifest.files.length,bytes:restoredBytes});
  }
  if(copied!==inventory.totalBytes||restoredBytes!==inventory.totalBytes)fail('private-backup-total-mismatch');
  const prefix='recurring/v1/runs/'+snapshot+'/',bytes=Buffer.from(JSON.stringify(manifest));
  if(bytes.length>4_000_000)fail('private-manifest-size-limit');
  const saved=await client.put(prefix+'manifest.json',bytes);if(hash(await client.get(saved,4_000_000))!==hash(bytes))fail('private-manifest-restore-failed');
  const receipt={snapshotId:snapshot,backupCompleted:true,restoreCompleted:true,sourceFiles:inventory.objects.length,backedUpFiles:manifest.files.length,restoredFiles:manifest.files.length,bytes:copied,restoredBytes,ownerlessFilesPreserved:inventory.objects.filter(o=>!o.owner_id&&!o.owner).length,manifestSha256:hash(bytes),productionFilesModified:false,bucketPrivacyChanged:false};
  const receiptBytes=Buffer.from(JSON.stringify(receipt)),savedReceipt=await client.put(prefix+'receipt.json',receiptBytes);
  if(hash(await client.get(savedReceipt,20000))!==hash(receiptBytes))fail('private-receipt-restore-failed');return receipt;
 }finally{const rel=relative(resolve(tmpdir()),root);if(!rel.startsWith('..')&&!rel.includes('/')&&!rel.includes('\\')&&basename(root).startsWith('clipt-private-restore-'))await rm(root,{recursive:true,force:true});}
}
