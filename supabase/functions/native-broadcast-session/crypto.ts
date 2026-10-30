import {NativeSessionError} from './protocol.ts';
const b64url=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
export function nativeRandomToken():string {
 return b64url(crypto.getRandomValues(new Uint8Array(48)));
}
export async function nativeTokenHash(value:string):Promise<string> {
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))))
  .map(x=>x.toString(16).padStart(2,'0')).join('');
}
export async function equalNativeSecret(left:string,right:string):Promise<boolean> {
 if(left.length<64 || right.length<64 || left.length>256 || right.length>256) return false;
 const a=await nativeTokenHash(left),b=await nativeTokenHash(right);
 let diff=0;for(let n=0;n<a.length;n++)diff|=a.charCodeAt(n)^b.charCodeAt(n);return diff===0;
}
function derLength(length:number):Uint8Array {
 if(length<128)return Uint8Array.of(length);
 const bytes:number[]=[];while(length){bytes.unshift(length&255);length=Math.floor(length/256);}
 return Uint8Array.of(128|bytes.length,...bytes);
}
function der(tag:number,body:Uint8Array):Uint8Array {
 const len=derLength(body.length);const result=new Uint8Array(1+len.length+body.length);
 result[0]=tag;result.set(len,1);result.set(body,1+len.length);return result;
}
function concat(...arrays:Uint8Array[]):Uint8Array {
 const result=new Uint8Array(arrays.reduce((sum,x)=>sum+x.length,0));let n=0;
 for(const a of arrays){result.set(a,n);n+=a.length;}return result;
}
export async function importNativeSigningKey(encoded:string):Promise<CryptoKey> {
 try {
  if(!encoded || encoded.length>16384)throw Error();
  const trimmed=encoded.trim();
  const pem=(trimmed.startsWith('-----BEGIN')
   ?trimmed.replaceAll('\\r\\n','\n').replaceAll('\\n','\n')
   :atob(trimmed.replace(/\s/g,''))).trim();
  const pkcs1=pem.includes('-----BEGIN RSA PRIVATE KEY-----');
  if(!pkcs1&&!pem.includes('-----BEGIN PRIVATE KEY-----'))throw Error();
  const payload=pem.replace(/-----BEGIN (?:RSA )?PRIVATE KEY-----|-----END (?:RSA )?PRIVATE KEY-----|\s/g,'');
  let bytes=Uint8Array.from(atob(payload),c=>c.charCodeAt(0));
  if(pkcs1){
   const algorithm=Uint8Array.from([0x30,0x0d,0x06,0x09,0x2a,0x86,0x48,0x86,0xf7,0x0d,0x01,0x01,0x01,0x05,0x00]);
   bytes=der(0x30,concat(Uint8Array.of(0x02,0x01,0x00),algorithm,der(0x04,bytes)));
  }
  const key=await crypto.subtle.importKey('pkcs8',bytes,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
  if((key.algorithm as RsaKeyAlgorithm).modulusLength<2048)throw Error();
  return key;
 }catch {throw new NativeSessionError(503,'PLAYBACK_UNAVAILABLE','Private live playback signing is unavailable');}
}
export async function nativePlaybackUrl(playbackId:string,expiresAt:number,keyId:string,key:CryptoKey,now=Date.now()):Promise<string> {
 if(!/^[A-Za-z0-9]{1,200}$/.test(playbackId)||!/^[A-Za-z0-9]{1,200}$/.test(keyId)
  ||!Number.isFinite(expiresAt)||expiresAt<=now||expiresAt>now+16*60*1000)
  throw new NativeSessionError(503,'PLAYBACK_UNAVAILABLE','Private live playback signing is unavailable');
 const enc=(x:unknown)=>b64url(new TextEncoder().encode(JSON.stringify(x)));
 const input=enc({alg:'RS256',typ:'JWT'})+'.'+enc({sub:playbackId,aud:'v',exp:Math.floor(expiresAt/1000),kid:keyId});
 const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(input));
 return 'https://stream.mux.com/'+playbackId+'.m3u8?token='+input+'.'+b64url(new Uint8Array(signature));
}
