// Protocol and orchestration are independent of Deno so the real guards can be tested.
export const NATIVE_DEVELOPMENT_ORIGIN = 'https://akiksrlzdqvipqbbjxpw.supabase.co';
export const NATIVE_INGEST_URL = 'rtmps://global-live.mux.com:443/app';
export const NATIVE_QUALITIES = ['360p15', '480p30', '720p30', '1080p30'] as const;
export type NativeSelection = {
  mode: 'camera' | 'screen'; quality: typeof NATIVE_QUALITIES[number];
  orientation: 'portrait' | 'landscape'; microphone: boolean; systemAudio: boolean;
  cameraPosition: 'front' | 'back';
};
export class NativeSessionError extends Error {
  status:number; code:string;
  constructor(status:number, code:string, message:string) { super(message); this.status=status; this.code=code; }
}
export type NativeSession = {
  sessionId: string; streamId: string | null; ownerId: string | null; state: string;
  selection: NativeSelection; providerId?: string; playbackId?: string;
  providerMode: 'test' | 'paid'; maxDurationSeconds: number; expiresAt: string;
  grantExpiresAt?: string; needsProvision?: boolean; providerStatus?: string;
};
export type NativeIdentity = { id: string; authSessionId: string; aal: 'aal1' | 'aal2' };
export type NativeProvider = {
  id: string; status: 'active' | 'idle' | 'disabled'; test: boolean;
  playback_ids: Array<{ id: string; policy: string }>; stream_key?: string;
  max_continuous_duration: number; passthrough: string;
};
export type NativeDependencies = {
  now(): number;
  randomToken(): string;
  hashToken(value: string): Promise<string>;
  authenticate(req: Request, options?: { allowRevoked?: boolean }): Promise<NativeIdentity>;
  db(action: string, args: Record<string, unknown>): Promise<any>;
  provider: {
    create(session: NativeSession): Promise<unknown>;
    read(id: string): Promise<unknown>;
    disable(id: string): Promise<void>;
  };
  signPlayback(playbackId: string, expiresAt: number): Promise<string>;
  config: { origin: string; enabled: boolean; provisioningEnabled: boolean;
    mode: 'test' | 'paid'; paidApproved: boolean; maxDurationSeconds: number;
    signingReady: boolean; operationsReady: boolean; testOwnerId: string; };
};
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const providerIdPattern = /^[A-Za-z0-9]{1,200}$/;
const tokenPattern = /^[A-Za-z0-9_-]{64,256}$/;
const selectionKeys = ['mode','quality','orientation','microphone','systemAudio','cameraPosition'];
function fail(status: number, code: string, message: string): never { throw new NativeSessionError(status,code,message); }
export function validUuid(value: unknown): string {
  if(typeof value !== 'string' || value.length!==36 || !uuidPattern.test(value)) fail(400,'INVALID_REQUEST','A valid identifier is required');
  return value;
}
export function nativeSelection(value: unknown): NativeSelection {
  if(!value || typeof value !== 'object' || Array.isArray(value)) fail(400,'INVALID_SELECTION','Choose valid broadcast settings');
  const x=value as Record<string,unknown>;
  if(Object.keys(x).some(k=>!selectionKeys.includes(k)) || Object.keys(x).length!==selectionKeys.length
    || !['camera','screen'].includes(x.mode as string)
    || !NATIVE_QUALITIES.includes(x.quality as any) || !['portrait','landscape'].includes(x.orientation as string)
    || typeof x.microphone!=='boolean' || typeof x.systemAudio!=='boolean'
    || !['front','back'].includes(x.cameraPosition as string)
    || (x.systemAudio && x.mode!=='screen')) fail(400,'INVALID_SELECTION','Choose valid broadcast settings');
  return {mode:x.mode,quality:x.quality,orientation:x.orientation,microphone:x.microphone,
    systemAudio:x.systemAudio,cameraPosition:x.cameraPosition} as NativeSelection;
}
function opaque(value: unknown): string {
  if(typeof value!=='string' || value.trim()!==value || !tokenPattern.test(value)) fail(401,'INVALID_GRANT','The broadcast authorization is invalid or expired');
  return value;
}
function assertSession(value: any): NativeSession {
  if(!value || typeof value!=='object') fail(503,'SESSION_UNAVAILABLE','Broadcast session is unavailable');
  validUuid(value.sessionId); if(value.streamId!==null) validUuid(value.streamId);
  if(!['test','paid'].includes(value.providerMode) || !Number.isInteger(value.maxDurationSeconds)
    || value.maxDurationSeconds<60 || value.maxDurationSeconds>7200
    || !Number.isFinite(Date.parse(value.expiresAt))) fail(503,'SESSION_UNAVAILABLE','Broadcast session is unavailable');
  nativeSelection(value.selection);
  return value;
}
export function providerSnapshot(value: unknown, session: NativeSession): NativeProvider {
  const x=value as NativeProvider;
  if(!x || typeof x!=='object' || typeof x.id!=='string' || !providerIdPattern.test(x.id)
    || (session.providerId && x.id!==session.providerId) || x.passthrough!==session.sessionId
    || typeof x.test!=='boolean' || x.test!==(session.providerMode==='test')
    || !['idle','active','disabled'].includes(x.status)
    || !Number.isInteger(x.max_continuous_duration)
    || x.max_continuous_duration<60 || x.max_continuous_duration>session.maxDurationSeconds
    || !Array.isArray(x.playback_ids) || x.playback_ids.length!==1
    || x.playback_ids[0]?.policy!=='signed' || !providerIdPattern.test(x.playback_ids[0]?.id ?? '')) {
    fail(502,'PROVIDER_UNVERIFIED','The streaming provider response could not be verified');
  }
  return x;
}
export function nativeConfigurationIssues(config: NativeDependencies['config']): string[] {
 const checks: Array<[string, boolean]> = [
  ['development_project', config.origin===NATIVE_DEVELOPMENT_ORIGIN],
  ['CLIPT_NATIVE_BROADCAST_ENABLED', config.enabled],
  ['CLIPT_NATIVE_MUX_CREATE_ENABLED', config.provisioningEnabled],
  ['signing_key_configuration', config.signingReady],
  ['webhook_or_cleanup_configuration', config.operationsReady],
  ['CLIPT_NATIVE_TEST_OWNER_ID', config.mode!=='test'||uuidPattern.test(config.testOwnerId||'')],
  ['paid_mode_approval', config.mode!=='paid'||config.paidApproved],
  ['CLIPT_NATIVE_MAX_DURATION_SECONDS', Number.isInteger(config.maxDurationSeconds)
   &&config.maxDurationSeconds>=60&&config.maxDurationSeconds<=(config.mode==='test'?300:7200)],
 ];
 // Return fixed labels only. Configuration values, credentials and account IDs
 // must never appear in operator diagnostics or public error responses.
 return checks.filter(([,passed])=>!passed).map(([name])=>name);
}
function enabled(d: NativeDependencies) {
 if(nativeConfigurationIssues(d.config).length) {
  fail(503,'NATIVE_DISABLED','Native broadcasting is not enabled for this environment');
 }
}
function publicStatus(s: NativeSession) {
  return {protocolVersion:1,sessionId:s.sessionId,streamId:s.streamId,state:s.state,
    selection:s.selection,expiresAt:s.expiresAt,maxDurationSeconds:s.maxDurationSeconds,
    isLive:s.state==='active' && s.providerStatus==='active'};
}
async function observe(d: NativeDependencies,s: NativeSession): Promise<NativeSession> {
  if(!s.providerId) return s;
  const observedAt=new Date(d.now()).toISOString();
  const snapshot=providerSnapshot(await d.provider.read(s.providerId),s);
  return assertSession(await d.db('snapshot',{sessionId:s.sessionId,providerId:snapshot.id,
    status:snapshot.status,playbackId:snapshot.playback_ids[0].id,observedAt}));
}
async function stopSession(d: NativeDependencies,s: NativeSession): Promise<void> {
  // Revoke local eligibility before provider I/O. A failed HTTP call leaves durable
  // stopping work for reconciliation; an end request never reports false success.
  if(s.providerId) {
    await d.provider.disable(s.providerId);
    const verified=providerSnapshot(await d.provider.read(s.providerId),s);
    if(verified.status!=='disabled') fail(502,'STOP_PENDING','Broadcast stop is pending provider confirmation');
    await d.db('finish_stop',{sessionId:s.sessionId,providerId:verified.id,observedAt:new Date(d.now()).toISOString()});
  } else await d.db('finish_stop',{sessionId:s.sessionId});
}
export async function nativeCommand(req: Request, body: Record<string,unknown>, d: NativeDependencies): Promise<Record<string,unknown>> {
  if(body.protocolVersion!==1) fail(400,'INVALID_PROTOCOL','Unsupported broadcasting protocol');
  if(d.config.origin!==NATIVE_DEVELOPMENT_ORIGIN) fail(503,'NATIVE_DISABLED','Native broadcasting is not enabled for this environment');
  const action=body.action;
  if(action==='create') {
    enabled(d);
    const identity=await d.authenticate(req);
    if(d.config.mode==='test'&&identity.id!==d.config.testOwnerId)fail(403,'TEST_OWNER_REQUIRED','The designated phone-test account is required');
    const selection=nativeSelection(body.selection);
    const streamId=validUuid(body.streamId),requestId=validUuid(body.requestId);
    const grant=d.randomToken(); opaque(grant);
    const s=assertSession(await d.db('reserve',{ownerId:identity.id,authSessionId:identity.authSessionId,
      aal:identity.aal,streamId,requestId,selection,providerMode:d.config.mode,
      maxDurationSeconds:d.config.maxDurationSeconds,grantHash:await d.hashToken(grant)}));
    if(s.needsProvision) {
      // The DB grants one provisioning claim. Uncertain HTTP outcomes must NOT
      // retry creation: reconciliation resolves passthrough before another grant.
      let resource: NativeProvider;
      try { resource=providerSnapshot(await d.provider.create(s),s); }
      catch { await d.db('uncertain',{sessionId:s.sessionId}).catch(()=>undefined);
        fail(502,'PROVISION_PENDING','Broadcast setup is pending reconciliation; do not start another broadcast'); }
      try { await d.db('attach',{sessionId:s.sessionId,providerId:resource.id,playbackId:resource.playback_ids[0].id}); }
      catch {
        await d.db('uncertain',{sessionId:s.sessionId,providerId:resource.id}).catch(()=>undefined);
        await d.provider.disable(resource.id).catch(()=>undefined);
        fail(503,'PROVISION_PENDING','Broadcast setup is pending reconciliation; do not start another broadcast');
      }
    } else if(s.state!=='ready') fail(409,'SESSION_EXISTS','A broadcast session is already starting or active');
    return {protocolVersion:1,sessionId:s.sessionId,streamId:s.streamId,grant,selection:s.selection,
      expiresAt:s.grantExpiresAt,maxDurationSeconds:s.maxDurationSeconds};
  }
  if(action==='redeem') {
    enabled(d);
    const grant=opaque(body.grant),stopToken=d.randomToken(); opaque(stopToken);
    const s=assertSession(await d.db('redeem',{grantHash:await d.hashToken(grant),stopHash:await d.hashToken(stopToken)}));
    try {
      if(s.providerMode==='test'&&s.ownerId!==d.config.testOwnerId)fail(403,'TEST_OWNER_REQUIRED','The designated phone-test account is required');
      const resource=providerSnapshot(await d.provider.read(s.providerId!),s);
      if(resource.status!=='idle') fail(409,'PROVIDER_BUSY','The broadcast is not ready to accept a connection');
      if(typeof resource.stream_key!=='string' || resource.stream_key.length<8 || resource.stream_key.length>256
        || !/^[A-Za-z0-9_-]+$/.test(resource.stream_key)) fail(502,'PROVIDER_UNVERIFIED','Broadcast credentials are unavailable');
      return {protocolVersion:1,sessionId:s.sessionId,ingestUrl:NATIVE_INGEST_URL,
        streamKey:resource.stream_key,stopToken,expiresAt:s.expiresAt,
        maxDurationSeconds:s.maxDurationSeconds,selection:s.selection};
    } catch(error) {
      const stopping=await d.db('stop',{sessionId:s.sessionId,stopHash:await d.hashToken(stopToken)}).catch(()=>null);
      if(stopping) await stopSession(d,assertSession(stopping)).catch(()=>undefined);
      throw error;
    }
  }
  if(action==='heartbeat') {
    const s=assertSession(await d.db('heartbeat',{sessionId:validUuid(body.sessionId),stopHash:await d.hashToken(opaque(body.stopToken))}));
    // The native service owns this heartbeat while the WebView is backgrounded.
    // Re-read Mux before refreshing discovery; client keepalive alone is never LIVE proof.
    const observed=await observe(d,s);
    return {protocolVersion:1,ok:true,expiresAt:observed.expiresAt};
  }
  if(action==='stop') {
    const sessionId=validUuid(body.sessionId);
    let auth: Record<string,unknown>;
    if(body.stopToken!==undefined) auth={stopHash:await d.hashToken(opaque(body.stopToken))};
    else {const owner=await d.authenticate(req,{allowRevoked:true});auth={ownerId:owner.id,authSessionId:owner.authSessionId};}
    const s=assertSession(await d.db('stop',{sessionId,...auth}));
    await stopSession(d,s);
    return {protocolVersion:1,sessionId:s.sessionId,state:'ended'};
  }
  if(action==='current') {
    const owner=await d.authenticate(req);
    const found=await d.db('current',{ownerId:owner.id,authSessionId:owner.authSessionId});
    return {protocolVersion:1,session:found?publicStatus(await observe(d,assertSession(found))):null};
  }
  if(action==='status') {
    const owner=await d.authenticate(req);
    const s=assertSession(await d.db('status',{sessionId:validUuid(body.sessionId),ownerId:owner.id,authSessionId:owner.authSessionId}));
    return publicStatus(await observe(d,s));
  }
  if(action==='playback') {
    if(!d.config.signingReady) fail(503,'PLAYBACK_UNAVAILABLE','Private live playback is unavailable');
    const viewer=await d.authenticate(req);
    const s=assertSession(await d.db('playback',{streamId:validUuid(body.streamId),viewerId:viewer.id,authSessionId:viewer.authSessionId,aal:viewer.aal}));
    const observed=await observe(d,s);
    if(observed.state!=='active' || observed.providerStatus!=='active' || !observed.playbackId)
      fail(409,'STREAM_OFFLINE','This broadcast is currently offline');
    const expiry=Math.min(d.now()+15*60*1000,Date.parse(observed.expiresAt));
    if(expiry<=d.now()) fail(409,'STREAM_OFFLINE','This broadcast is currently offline');
    return {protocolVersion:1,playbackUrl:await d.signPlayback(observed.playbackId,expiry),
      expiresAt:new Date(expiry).toISOString()};
  }
  fail(400,'INVALID_ACTION','Choose a valid broadcasting action');
}
export async function nativeRequestBody(req: Request): Promise<Record<string,unknown>> {
  if(req.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')
    fail(415,'INVALID_REQUEST','Send application/json');
  const reader=req.body?.getReader(); if(!reader) fail(400,'INVALID_REQUEST','Send a JSON object');
  let size=0;const chunks:Uint8Array[]=[];
  while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;
    if(size>8192){await reader.cancel();fail(413,'INVALID_REQUEST','Request body is too large');}chunks.push(part.value);}
  const bytes=new Uint8Array(size);let offset=0;for(const p of chunks){bytes.set(p,offset);offset+=p.length;}
  try {const body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
    if(!body || typeof body!=='object' || Array.isArray(body)) throw Error();
    return body;
  }catch {fail(400,'INVALID_REQUEST','Send a valid JSON object');}
}
export const nativeHeaders = {
  'Content-Type':'application/json','Cache-Control':'no-store, private','Pragma':'no-cache',
  'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods':'POST, OPTIONS','X-Content-Type-Options':'nosniff',
};
export function nativeResponse(value: unknown,status=200) {return new Response(JSON.stringify(value),{status,headers:nativeHeaders});}
export function nativeError(error: unknown) {
  return error instanceof NativeSessionError
    ? nativeResponse({error:error.message,code:error.code},error.status)
    : nativeResponse({error:'Broadcast operation could not be completed',code:'BROADCAST_UNAVAILABLE'},503);
}
