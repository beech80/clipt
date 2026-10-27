import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const avatarSource=stripTypeScriptTypes(readFileSync(new URL('../../src/lib/avatar-upload.ts',import.meta.url),'utf8'));
const avatarUrl='data:text/javascript;base64,'+Buffer.from(avatarSource).toString('base64');
const source=stripTypeScriptTypes(readFileSync(new URL('../../src/lib/photo-upload.ts',import.meta.url),'utf8')).replace("'./avatar-upload'",JSON.stringify(avatarUrl));
const {preparePhoto,photoUploadError}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const png=()=>new File([new Uint8Array([137,80,78,71,13,10,26,10])],'source.png',{type:'image/png'});

test('photos reject unsupported, forged, empty and oversized inputs before decoding',async()=>{
  for(const file of [new File(['<svg/>'],'x.svg',{type:'image/svg+xml'}),new File(['bad'],'x.png',{type:'image/png'}),new File([],'x.jpg',{type:'image/jpeg'}),{type:'image/jpeg',size:5242881,slice:()=>new Blob([new Uint8Array([255,216,255])])}]) await assert.rejects(preparePhoto(file));
});
test('photo processing preserves ratio, strips original bytes, and closes decoded resources',async()=>{
  let closed=false,canvas,draw;
  globalThis.createImageBitmap=async()=>({width:6000,height:3000,close(){closed=true;}});
  globalThis.document={createElement:()=>canvas={getContext:()=>({drawImage:(...args)=>draw=args}),toBlob:(done,type)=>done(new Blob(['encoded-pixels'],{type}))}};
  try {
    const result=await preparePhoto(png());
    assert.equal(result.type,'image/jpeg');assert.equal(result.name,'photo.jpg');
    assert.equal(canvas.width,4096);assert.equal(canvas.height,2048);assert.equal(draw[3],4096);
    assert.equal(await result.text(),'encoded-pixels');assert.equal(closed,true);
  } finally { delete globalThis.createImageBitmap;delete globalThis.document; }
});
test('photo decode/encoding failures fail closed and never return original payload',async()=>{
  let closed=0;
  globalThis.createImageBitmap=async()=>({width:9000,height:1,close(){closed++;}});
  try {
    await assert.rejects(preparePhoto(png()),/dimensions/);assert.equal(closed,1);
    globalThis.createImageBitmap=async()=>({width:20,height:20,close(){closed++;}});
    globalThis.document={createElement:()=>({getContext:()=>({drawImage(){}}),toBlob:done=>done(null)})};
    await assert.rejects(preparePhoto(png()),/processing failed/);assert.equal(closed,2);
  } finally { delete globalThis.createImageBitmap;delete globalThis.document; }
});
test('photo errors preserve form contents and never claim successful draft persistence',()=>{
  for(const statusCode of [401,403,413,500]) assert.match(photoUploadError({statusCode}),/photo and caption remain.*no new draft was saved/);
});
test('animated PNG and WebP cannot silently become misleading still-photo uploads',async()=>{
  const animatedPng=Buffer.alloc(20);Buffer.from([137,80,78,71,13,10,26,10]).copy(animatedPng);animatedPng.write('acTL',12);
  const animatedWebp=Buffer.from('RIFF0000WEBPANIM0000');
  await assert.rejects(preparePhoto(new File([animatedPng],'animation.png',{type:'image/png'})),/Animated/);
  await assert.rejects(preparePhoto(new File([animatedWebp],'animation.webp',{type:'image/webp'})),/Animated/);
});
