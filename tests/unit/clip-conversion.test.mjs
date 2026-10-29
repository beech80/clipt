import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import * as admission from '../../src/lib/clip-upload.ts';
const require=createRequire(import.meta.url);
function load(path,deps={}) {
  const code=ts.transpileModule(readFileSync(new URL('../../src/'+path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{}};
  new Function('require','module','exports',code)(name=>deps[name]??require(name),mod,mod.exports);
  return mod.exports;
}
const {convertClip}=load('lib/convert-clip.ts',{'./clip-upload':admission});
const {prepareClipFile}=load('lib/prepare-clip.ts',{'./clip-upload':admission,'./convert-clip':{convertClip}});
function sample(codec='avc1',type='video/mp4') {
  const data=Buffer.alloc(32);data.writeUInt32BE(32,0);data.write(codec,4);
  return new File([data],'recording.'+(type==='video/quicktime'?'mov':'mp4'),{type});
}
function fixture(options={}) {
  const calls={disposed:0,cancelled:0,outputCancelled:0,config:null,executed:0};
  const video={codec:'hevc',canDecode:async()=>options.decode!==false,getDisplayWidth:async()=>options.width??3840,getDisplayHeight:async()=>options.height??2160};
  const audio=options.audio===false?null:{codec:'aac'};
  let rejectExecution;
  class BlobSource {constructor(blob){this.blob=blob;}}
  class Input {
    constructor({source}){this.result=source.blob.name.endsWith('-compatible.mp4');}
    async getPrimaryVideoTrack(){return this.result?{codec:options.resultCodec??'avc'}:video;}
    async getPrimaryAudioTrack(){return this.result&&options.dropResultAudio?null:audio;}
    async computeDuration(){return options.duration??1;}
    dispose(){calls.disposed++;}
  }
  class BufferTarget {constructor(){this.buffer=options.buffer??sample().arrayBuffer();}}
  // A real ArrayBuffer is provided by the async builder below.
  class Output {constructor({target}){this.target=target;}async cancel(){calls.outputCancelled++;}}
  class Quality {constructor(value){this.value=value;}}
  const conversion={isValid:true,utilizedTracks:options.dropAudio?[video]:[video,...(audio?[audio]:[])],
    async execute(){calls.executed++;this.onProgress?.(1);if(options.wait)return new Promise((_resolve,reject)=>{rejectExecution=reject;queueMicrotask(options.wait);});},
    async cancel(){calls.cancelled++;rejectExecution?.(new Error('Cancelled native work'));}};
  const sdk={Input,BlobSource,BufferTarget,Output,Quality,MP4:{},QTFF:{},Mp4OutputFormat:class {},
    Conversion:{async init(config){calls.config=config;return conversion;}}};
  return {sdk,calls,video,audio};
}
async function library(options={}) {
  const f=fixture({...options,buffer:options.buffer??await sample().arrayBuffer()});return f;
}
test('supported H.264 is unchanged and does not load a converter',async()=>{
  const file=sample();let converted=false;
  assert.equal(await prepareClipFile(file,{},async()=>{converted=true;throw Error('unexpected');}),file);
  assert.equal(converted,false);
});
test('HEVC and MOV use conversion, then revalidate the output',async()=>{
  for(const file of [sample('hvc1'),sample('avc1','video/quicktime')]) {
    let original;const result=await prepareClipFile(file,{},async value=>{original=value;return sample();});
    assert.equal(original,file);assert.equal(result.type,'video/mp4');
  }
  await assert.rejects(prepareClipFile(sample('hvc1'),{},async()=>sample('hvc1')),admission.ClipConversionRequired);
  let invoked=false;
  await assert.rejects(prepareClipFile(new File([],'empty.mp4',{type:'video/mp4'}),{},async()=>{invoked=true;}),/empty/);
  assert.equal(invoked,false);
});
test('conversion produces bounded AVC, retains audio and checks the final container',async()=>{
  const {sdk,calls}=await library();
  const file=await convertClip(sample('hvc1'),{},async()=>sdk);
  assert.equal(file.type,'video/mp4');assert.match(file.name,/-compatible\.mp4$/);
  assert.equal(calls.config.video.codec,'avc');assert.equal(calls.config.video.fit,'contain');
  assert.equal(calls.config.video.width,1280);assert.equal(calls.config.video.height,720);
  assert.equal(calls.config.video.allowTransformationMetadata,false);
  assert.equal(calls.config.audio.codec,'aac');assert.equal(calls.config.audio.quality,undefined,'AAC is copied instead of needlessly re-encoded');
  assert.ok(calls.disposed>=2);assert.equal(calls.executed,1);
});
test('portrait aspect ratio is preserved and an unavailable decoder fails closed',async()=>{
  const portrait=await library({width:2160,height:3840});
  await convertClip(sample('hvc1'),{},async()=>portrait.sdk);
  assert.equal(portrait.calls.config.video.width,720);assert.equal(portrait.calls.config.video.height,1280);
  const denied=await library({decode:false});
  await assert.rejects(convertClip(sample('hvc1'),{},async()=>denied.sdk),/browser cannot convert/);
  assert.equal(denied.calls.executed,0);assert.ok(denied.calls.disposed);
});
test('conversion never silently drops source audio or accepts an unverifiable output',async()=>{
  for(const options of [{dropAudio:true},{dropResultAudio:true},{resultCodec:'hevc'},{buffer:new ArrayBuffer(0)},{buffer:{byteLength:admission.MAX_CLIP_BYTES+1}}]) {
    const f=await library(options);
    await assert.rejects(convertClip(sample('hvc1'),{},async()=>f.sdk));
    assert.ok(f.calls.disposed);assert.ok(f.calls.outputCancelled);
  }
});
test('cancellation releases input and output and prevents a prepared file',async()=>{
  const controller=new AbortController();
  const f=await library({wait:()=>controller.abort()});
  await assert.rejects(convertClip(sample('hvc1'),{signal:controller.signal},async()=>f.sdk),error=>error.name==='AbortError');
  assert.ok(f.calls.cancelled);assert.ok(f.calls.outputCancelled);assert.ok(f.calls.disposed);
  await assert.rejects(prepareClipFile(sample('hvc1'),{signal:controller.signal}),error=>error.name==='AbortError');
});
test('long conversion inputs are rejected before native encoding starts',async()=>{
  const f=await library({duration:301});
  await assert.rejects(convertClip(sample('hvc1'),{},async()=>f.sdk),/up to 5 minutes/);
  assert.equal(f.calls.executed,0);assert.ok(f.calls.disposed);
});
