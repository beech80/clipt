import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const source = stripTypeScriptTypes(readFileSync(new URL('../../src/lib/membership-read.ts',import.meta.url),'utf8'));
const {membershipRead} = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
test('membership read preserves actual confirmed response', async () => {
  assert.deepEqual(await membershipRead(async signal => {assert.equal(signal.aborted,false);return {data:null,error:null};}), {data:null,error:null});
});
test('stalled membership status aborts and rejects instead of inventing success', async () => {
  let signal;
  await assert.rejects(membershipRead(value => {signal=value;return new Promise(()=>{});},20),/timed out/);
  assert.equal(signal.aborted,true);
});
test('membership provider failures remain failures', async () => {
  await assert.rejects(membershipRead(async()=>{throw new Error('Read denied');}),/Read denied/);
});
