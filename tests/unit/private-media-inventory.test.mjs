import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyPrivateMediaInventory } from '../../scripts/private-media-release.mjs';

const owner='00000000-0000-4000-8000-000000000001';
const other='00000000-0000-4000-8000-000000000002';
const row=(number,values={})=>({id:`00000000-0000-4000-8000-${String(number).padStart(12,'0')}`,bucket_id:'media',name:`${owner}/clip.mp4`,owner_id:owner,owner,...values});
test('inventory separates canonical, verified legacy and ownerless files without mutation',()=>{
 const input=[row(10),row(11,{name:'old-clip.mp4'}),row(12,{name:'unowned.mp4',owner_id:null,owner:null})];
 const before=JSON.stringify(input);const plan=classifyPrivateMediaInventory(input);
 assert.deepEqual(plan.counts,{canonical:1,legacyVerifiedOwner:1,reviewRequired:1});
 assert.equal(plan.total,3);assert.equal(plan.mutationPerformed,false);assert.equal(JSON.stringify(input),before);
 assert.equal(plan.entries[2].status,'reviewRequired');
});
test('conflicting and invalid recorded owners require review instead of choosing one',()=>{
 for(const values of [{owner_id:other},{owner_id:'service_role'},{owner:'invalid'}]) {
  assert.equal(classifyPrivateMediaInventory([row(10,values)]).counts.reviewRequired,1);
 }
});
test('legacy UUID owner fallback does not imply a path migration was performed',()=>{
 const result=classifyPrivateMediaInventory([row(10,{owner_id:null,name:'old/file.mp4'})]);
 assert.equal(result.counts.legacyVerifiedOwner,1);assert.equal(result.mutationPerformed,false);
});
test('inventory refuses duplicates, foreign buckets and unsafe paths',()=>{
 for(const input of [[row(10),row(10)], [row(10),row(11)], [row(10,{bucket_id:'unknown'})],
  [row(10,{name:'../clip.mp4'})], [row(10,{name:'a//clip.mp4'})], [row(10,{name:'a\\clip.mp4'})],
  [row(10,{name:'a\nclip.mp4'})], [row(10,{id:'not-an-id'})]]) {
  assert.throws(()=>classifyPrivateMediaInventory(input));
 }
});
