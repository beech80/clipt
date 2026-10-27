import test from 'node:test';import assert from 'node:assert/strict';
import {runPhotoReview,reviewStorageTarget,reviewImageBytes} from '../../supabase/functions/_shared/photo-review-workflow.ts';
const owner='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',project='https://development.invalid';
const post={user_id:owner,is_published:true,is_premium:false,is_subscriber_only:false,required_tier_id:null,moderation_hidden:false,post_type:'clipt',video_url:null,image_url:project+'/storage/v1/object/public/media/'+owner+'/photo.jpg',content:'Great game!'};
const jpeg=Uint8Array.from([255,216,255,224,0,0,0,0,0,0,0,0]);
function fixture(change={}){const calls=[];return {calls,deps:{reserve:async()=>true,read:async()=>({...post,...change}),download:async()=>jpeg,analyze:async value=>{calls.push(value);return 'needs_review'},finish:async state=>calls.push(state),log:event=>calls.push(event)}}}
test('workflow flags approved public photo and caption without deleting content',async()=>{const f=fixture();assert.deepEqual(await runPhotoReview(owner,project,f.deps),{state:'needs_review'});assert.equal(f.calls.length,4);});
test('private, foreign and unsupported content never reaches Azure',async()=>{for(const change of [{is_published:false},{user_id:'other'},{post_type:'squad'},{is_subscriber_only:true},{image_url:'https://foreign.invalid/photo.jpg'}]){const f=fixture(change);await assert.rejects(runPhotoReview(owner,project,f.deps));assert.deepEqual(f.calls,['failed','photo_review_failed']);}});
test('quota reservation replay performs no download or provider operation',async()=>{const f=fixture();f.deps.reserve=async()=>false;assert.deepEqual(await runPhotoReview(owner,project,f.deps),{state:'already_reserved'});assert.equal(f.calls.length,0);});
test('provider failure persists failure and logs no caption, image or provider error',async()=>{const f=fixture();f.deps.analyze=async()=>{throw Error('private-provider-secret')};await assert.rejects(runPhotoReview(owner,project,f.deps),/unavailable/);assert.deepEqual(f.calls,['failed','photo_review_failed']);});
test('storage references refuse foreign owner, signed tokens, encoded paths and URLs',()=>{for(const value of [post.image_url+'?token=secret',post.image_url.replace(owner,'other'),post.image_url.replace('photo.jpg','%2e%2e/private.jpg'),'https://other.invalid/a'])assert.throws(()=>reviewStorageTarget(value,owner,project));assert.throws(()=>reviewImageBytes(new Uint8Array(12)));});
test('storage references reject raw traversal before URL normalization',()=>{
 for(const path of ['folder/../photo.jpg','./photo.jpg','../'+owner+'/photo.jpg'])
  assert.throws(()=>reviewStorageTarget(post.image_url.replace('photo.jpg',path),owner,project));
});
test('lost completion response never claims success and records reconciliation without sensitive logs',async()=>{
 const f=fixture();f.deps.finish=async()=>{throw Error('database credential')};
 await assert.rejects(runPhotoReview(owner,project,f.deps),/unavailable/);
 assert.deepEqual(f.calls.slice(-2),['photo_review_reconciliation_required','photo_review_failed']);
});
test('unknown caption result cannot approve an otherwise unflagged photo',async()=>{
 const f=fixture();f.deps.analyze=async input=>input.caption?'unexpected':'no_flag_detected';
 await assert.rejects(runPhotoReview(owner,project,f.deps),/unavailable/);
 assert.deepEqual(f.calls,['failed','photo_review_failed']);
});
test('unknown image result cannot be masked by a flagged caption',async()=>{
 const f=fixture();let requests=0;f.deps.analyze=async()=>++requests===1?'unexpected':'needs_review';
 await assert.rejects(runPhotoReview(owner,project,f.deps),/unavailable/);
 assert.equal(requests,1);assert.deepEqual(f.calls,['failed','photo_review_failed']);
});
