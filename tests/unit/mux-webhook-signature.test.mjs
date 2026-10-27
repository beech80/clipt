import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const source=readFileSync(new URL('../../supabase/functions/_shared/mux-webhook-signature.ts',import.meta.url),'utf8');
const {verifyMuxSignature}=await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
const secret='local-fixture-only';
const body='{"type":"video.live_stream.active","data":{"id":"fixture"}}';
const raw=new TextEncoder().encode(body);
const stamp=1800000000;
const sign=(text=body,at=stamp,key=secret)=>`t=${at},v1=${createHmac('sha256',key).update(at+'.'+text).digest('hex')}`;
test('valid signed raw bytes accepted; modified bytes and wrong secret denied',async()=>{
 assert.equal(await verifyMuxSignature(raw,sign(),secret,stamp),true);
 assert.equal(await verifyMuxSignature(new TextEncoder().encode(body+' '),sign(),secret,stamp),false);
 assert.equal(await verifyMuxSignature(raw,sign(),secret+'wrong',stamp),false);
});
test('missing, malformed, duplicate timestamp and expired or future signatures denied',async()=>{
 for(const header of [null,'v1=abc',sign()+`,t=${stamp}`,sign(body,stamp-301),sign(body,stamp+301)])
  assert.equal(await verifyMuxSignature(raw,header,secret,stamp),false);
 assert.equal(await verifyMuxSignature(raw,sign(),'',stamp),false);
 assert.equal(await verifyMuxSignature(new Uint8Array(65537),sign(),secret,stamp),false);
});
test('signature rotation permits a valid secondary signature',async()=>{
 assert.equal(await verifyMuxSignature(raw,sign(body,stamp,'other')+','+sign().split(',')[1],secret,stamp),true);
});
