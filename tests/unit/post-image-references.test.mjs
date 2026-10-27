import test from 'node:test';
import assert from 'node:assert/strict';
import {postImageReferences} from '../../src/lib/post-image-references.ts';
test('post image lists preserve provider transformation commas and original order',()=>{
  const transformed='https://res.cloudinary.com/example/image/upload/w_400,h_300,c_fill/photo.jpg';
  assert.deepEqual(postImageReferences(`${transformed}, https://development.supabase.co/storage/v1/object/public/media/owner/photo.jpg`),[transformed,'https://development.supabase.co/storage/v1/object/public/media/owner/photo.jpg']);
  assert.deepEqual(postImageReferences(transformed),[transformed]);
  assert.deepEqual(postImageReferences(null),[]);
});
