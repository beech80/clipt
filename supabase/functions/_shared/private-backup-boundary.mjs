export const BACKUP_PROJECT='slnjliheyiiummxhrgmk';
export const BACKUP_SOURCE='https://'+BACKUP_PROJECT+'.supabase.co';
export const BACKUP_ENDPOINT=BACKUP_SOURCE+'/functions/v1/private-media-backup';
export const BACKUP_BUCKETS=['avatars','clipt-avatars','media','posts','recordings','videos'];
export const MAX_OBJECTS=1000,MAX_FILE_BYTES=100_000_000,MAX_TOTAL_BYTES=5_000_000_000;
export const backupError=code=>{throw Error(code);};
export function validateBackupObject(o){
 if(!o||typeof o.id!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(o.id)
 ||!BACKUP_BUCKETS.includes(o.bucket)||o.bucket_id!==o.bucket||o.public!==false
 ||typeof o.name!=='string'||!o.name||o.name.length>1024||o.name.includes('\\')||/[\x00-\x1f\x7f]/.test(o.name)
 ||o.name.split('/').some(p=>!p||p==='.'||p==='..')||!Number.isSafeInteger(o.metadata?.size)
 ||o.metadata.size<0||o.metadata.size>MAX_FILE_BYTES||typeof o.metadata.eTag!=='string'
 ||!/^"?[a-f0-9]{32}(?:-\d+)?"?$/i.test(o.metadata.eTag)
 ||o.archived_at||o.is_delete_marker||o.is_versioned)backupError('invalid-private-source-object');
 return o;
}
export function validatePrivateInventory(v){
 if(v?.format!=='clipt-private-media-inventory-v1'||v.project!==BACKUP_PROJECT||!Number.isFinite(Date.parse(v.capturedAt))
 ||!Array.isArray(v.objects)||!v.objects.length||v.objects.length>MAX_OBJECTS)backupError('private-inventory-out-of-bounds');
 let bytes=0;const ids=new Set(),paths=new Set();
 for(const o of v.objects){validateBackupObject(o);const path=o.bucket+'/'+o.name;if(ids.has(o.id)||paths.has(path))backupError('duplicate-private-source');ids.add(o.id);paths.add(path);bytes+=o.metadata.size;}
 if(bytes!==v.totalBytes||bytes>MAX_TOTAL_BYTES)backupError('private-inventory-byte-limit');return v;
}
export function sourceIdentity(o){validateBackupObject(o);return JSON.stringify([o.id,o.bucket,o.name,o.version??null,o.owner_id??null,o.owner??null,o.created_at??null,o.updated_at??null,o.metadata.size,o.metadata.eTag.replaceAll('"','').toLowerCase()]);}
export async function sourceIdentityHash(o){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(sourceIdentity(o))))).map(x=>x.toString(16).padStart(2,'0')).join('');}
export function storageObjectPath(o){validateBackupObject(o);return o.bucket+'/'+o.name.split('/').map(encodeURIComponent).join('/');}
export function validateSignedSource(value,o){
 validateBackupObject(o);let u;try{u=new URL(value);}catch{backupError('invalid-signed-source');}
 if(u.origin!==BACKUP_SOURCE||u.username||u.password||u.port||u.hash
 ||decodeURIComponent(u.pathname)!=='/storage/v1/object/sign/'+o.bucket+'/'+o.name
 ||u.searchParams.size!==1||!u.searchParams.get('token')||u.searchParams.get('token').length>8000)backupError('invalid-signed-source');
 return u.toString();
}
