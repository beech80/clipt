import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const source=stripTypeScriptTypes(readFileSync(new URL('../../src/lib/message-history.ts',import.meta.url),'utf8'));
const {mergeMessageHistory}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const old={id:'a',created_at:'2026-09-20T00:00:00Z',content:'Old'};
const sent={id:'b',created_at:'2026-09-20T00:00:01Z',content:'Confirmed send'};
test('late history cannot erase a confirmed send or realtime insert',()=>{
  assert.deepEqual(mergeMessageHistory([old],[sent]),[old,sent]);
  assert.deepEqual(mergeMessageHistory([],[sent]),[sent]);
});
test('history merge deduplicates events and orders timestamp ties by ID',()=>{
  const tie={...old,id:'c'};
  assert.deepEqual(mergeMessageHistory([tie,old,sent],[sent]),[old,tie,sent]);
});

test('stale history and stale realtime snapshots cannot reverse a read receipt',()=>{
  assert.equal(mergeMessageHistory([{...old,read:true}],[{...old,read:false}])[0].read,true);
  assert.equal(mergeMessageHistory([{...old,read:false}],[{...old,read:true}])[0].read,true);
});
