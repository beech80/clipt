import {BACKUP_SOURCE,validatePrivateInventory,validateBackupObject,sourceIdentityHash,storageObjectPath,validateSignedSource} from './private-backup-boundary.mjs';
import {verifyBackupOidc,attestBackupRunner,sha256Text} from './private-backup-oidc.mjs';
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export function createPrivateBackupHandler({reviewedFiles,getEnv,fetchImpl=fetch,verifyToken=verifyBackupOidc,attestRunner=attestBackupRunner,now=()=>Date.now()}){
 const tokens=new Map(),sources=new Map();
 async function authorize(token){
  if(typeof token!=='string'||token.length>16000)throw Error('backup-authorization-denied');
  const fingerprint=await sha256Text(token);const hit=tokens.get(fingerprint);
  if(hit&&hit.exp*1000>now())return hit;
  const claims=await verifyToken(token,{now:now(),fetchImpl});
  const sourceKey=claims.sha+':'+claims.workflow_sha;
  if((sources.get(sourceKey)||0)<=now()){await attestRunner(claims,reviewedFiles,{fetchImpl});if(sources.size>=50)sources.delete(sources.keys().next().value);sources.set(sourceKey,now()+300000);}
  for(const[k,v]of tokens)if(v.exp*1000<=now())tokens.delete(k);
  if(tokens.size>=50)tokens.delete(tokens.keys().next().value);tokens.set(fingerprint,claims);return claims;
 }
 return async req=>{
  if(req.method!=='POST')return json({error:'Not available'},405);
  let claims;try{const token=req.headers.get('Authorization')?.match(/^Bearer ([A-Za-z0-9_.-]+)$/)?.[1];claims=await authorize(token);}catch{return json({error:'Not authorized'},401);}
  let body;try{const text=await req.text();if(text.length>16000)throw Error();body=JSON.parse(text);
   if(body.action!=='inventory'&&body.action!=='sign')throw Error();
   if(body.action==='sign'&&(!/^[a-f0-9-]{36}$/i.test(body.id||'')||!/^[a-f0-9]{64}$/.test(body.identity||'')))throw Error();
  }catch{return json({error:'Invalid request'},400);}
  // Administrative credentials are never loaded before OIDC and reviewed-source attestation.
  const secret=getEnv('SUPABASE_SERVICE_ROLE_KEY');
  if(!secret||getEnv('SUPABASE_URL')!==BACKUP_SOURCE)return json({error:'Not configured'},503);
  async function call(path,data){
   const r=await fetchImpl(BACKUP_SOURCE+path,{method:'POST',redirect:'error',cache:'no-store',headers:{apikey:secret,Authorization:'Bearer '+secret,'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(20000)});
   if(!r.ok){await r.body?.cancel();throw Error('private-source-unavailable');}
   const text=await r.text();if(text.length>4000000)throw Error('private-source-unavailable');return JSON.parse(text);
  }
  try{
   if(body.action==='inventory'){
    const inventory=validatePrivateInventory(await call('/rest/v1/rpc/clipt_backup_inventory',{}));
    return json({...inventory,runId:claims.run_id,runAttempt:claims.run_attempt});
   }
   const object=validateBackupObject(await call('/rest/v1/rpc/clipt_backup_object',{p_id:body.id}));
   if(await sourceIdentityHash(object)!==body.identity)return json({error:'Source changed'},409);
   const signed=await call('/storage/v1/object/sign/'+storageObjectPath(object),{expiresIn:300});
   const path=signed.signedURL??signed.signedUrl;
   if(typeof path!=='string'||!path.startsWith('/object/sign/'))throw Error('private-source-unavailable');
   const url=validateSignedSource(BACKUP_SOURCE+'/storage/v1'+path,object);
   return json({url,expiresIn:300});
  }catch{return json({error:'Backup source unavailable'},503);}
 };
}
