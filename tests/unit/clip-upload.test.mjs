import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const source = stripTypeScriptTypes(readFileSync(new URL('../../src/lib/clip-upload.ts',import.meta.url),'utf8'));
const {validateClipFile,clipCaption,clipUploadError,formatClipSize,MAX_CLIP_BYTES} = await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));

test('upload failures explain the cause without claiming an unsaved draft exists',()=>{
  for(const [error,expected] of [[{statusCode:413},/50 MB/],[{statusCode:401},/sign-in expired/],[{statusCode:403},/MFA/],[{message:'mime type denied'},/format/],[{statusCode:429},/rate limited/],[{message:'private provider error'},/connection/]]) {
    const message=clipUploadError(error);
    assert.match(message,expected);assert.match(message,/no new draft was saved/);assert.doesNotMatch(message,/private provider error|draft is still here/);
  }
});
test('clip upload rejects empty, oversized and non-video inputs',async () => {
  await assert.rejects(validateClipFile(new File([],'empty.mp4',{type:'video/mp4'})));
  await assert.rejects(validateClipFile(new File(['<svg/>'],'bad.svg',{type:'image/svg+xml'})));
  await assert.rejects(validateClipFile({type:'video/mp4',size:52428801}));
});
test('clip upload detects HEVC sample entries including trailing metadata',async () => {
  for (const codec of ['hvc1','hev1']) {
    const bytes = Buffer.alloc(256); bytes.writeUInt32BE(32,224); bytes.write(codec,228);
    await assert.rejects(validateClipFile(new File([bytes],'hevc.mp4',{type:'video/mp4'})),/HEVC/);
  }
  const bytes = Buffer.alloc(32); bytes.writeUInt32BE(32,0); bytes.write('avc1',4);
  await validateClipFile(new File([bytes],'h264.mp4',{type:'video/mp4'}));
});
test('clip caption validates and normalizes hashtags',() => {
  assert.equal(clipCaption(' Moment ','#Gaming gaming,Clipt'),'Moment\n\n#gaming #clipt');
  assert.throws(()=>clipCaption('',''));
  assert.throws(()=>clipCaption('ok','#bad-tag'));
});

test('video selection distinguishes unreadable Photos files from an oversized export',async()=>{
  await assert.rejects(validateClipFile(new File([],'cloud-export.mp4',{type:'video/mp4'})),error=>/empty or could not be read/.test(error.message)&&/Download it to your device/.test(error.message)&&!/between 1 byte/.test(error.message));
  await assert.rejects(validateClipFile({type:'video/mp4',size:51*1024*1024}),/This video is 51 MB.*limit is 50 MB/);
  await assert.rejects(validateClipFile({type:'video/mp4',size:MAX_CLIP_BYTES+1}),/50\.1 MB/);
  assert.equal(formatClipSize(MAX_CLIP_BYTES),'50 MB');
  assert.equal(formatClipSize(0),'0 bytes');assert.equal(formatClipSize(1),'1 byte');
});
test('videos at and below the storage size boundary remain accepted',async()=>{
  for(const size of [1,49*1024*1024,MAX_CLIP_BYTES])await validateClipFile({type:'video/webm',size});
  for(const size of [-1,NaN,Infinity,0])await assert.rejects(validateClipFile({type:'video/webm',size}),/empty or could not be read/);
});
