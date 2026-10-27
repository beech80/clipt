import test from 'node:test';
import assert from 'node:assert/strict';
import { privateMediaReference } from '../../src/lib/private-media-reference.ts';

const origin = 'https://development-example.supabase.co';
const owner = '00000000-0000-4000-8000-000000000001';
test('private-media parser recognizes owned-path references without trusting URL tokens', () => {
  for (const kind of ['public', 'authenticated', 'sign']) {
    assert.deepEqual(privateMediaReference(`${origin}/storage/v1/object/${kind}/media/${owner}/clip.mp4?token=ignored`, origin), { bucket: 'media', path: `${owner}/clip.mp4` });
  }
});
test('private-media parser refuses foreign origins, unknown buckets and ambiguous paths', () => {
  for (const value of [
    `https://production-example.supabase.co/storage/v1/object/public/media/${owner}/clip.mp4`,
    `http://development-example.supabase.co/storage/v1/object/public/media/${owner}/clip.mp4`,
    `https://user:password@development-example.supabase.co/storage/v1/object/public/media/${owner}/clip.mp4`,
    `${origin}/storage/v1/object/public/secrets/${owner}/clip.mp4`,
    `${origin}/storage/v1/object/public/media/not-an-owner/clip.mp4`,
    `${origin}/storage/v1/object/public/media/${owner}/../${owner}/clip.mp4`,
    `${origin}/storage/v1/object/public/media/${owner}/%2e%2e/${owner}/clip.mp4`,
    `${origin}/storage/v1/object/public/media/${owner}/a%2fb.mp4`,
    `${origin}/storage/v1/object/public/media/${owner}/a%252fb.mp4`,
    `${origin}/storage/v1/object/public/media/${owner}/a%5cb.mp4`,
    `${origin}/storage/v1/object/public/media/${owner}/a\\b.mp4`,
    `${origin}/storage/v1/object/public/media/${owner}/a%00b.mp4`,
    `${origin}/storage/v1/object/public/media/${owner}/%zz`,
    'not a URL',
  ]) assert.equal(privateMediaReference(value, origin), null, value);
});
test('explicit legacy parsing accepts safe paths but never grants access or relaxes origin/traversal checks',()=>{
 const legacy=`${origin}/storage/v1/object/public/videos/old-clip.mp4`;
 assert.equal(privateMediaReference(legacy,origin),null);
 assert.deepEqual(privateMediaReference(legacy,origin,true),{bucket:'videos',path:'old-clip.mp4'});
 for(const value of [legacy.replace(origin,'https://foreign.invalid'),legacy.replace('old-clip.mp4','%2e%2e/file'),legacy.replace('old-clip.mp4','a%2fb'),legacy.replace('/videos/','/secrets/')])
  assert.equal(privateMediaReference(value,origin,true),null);
});
