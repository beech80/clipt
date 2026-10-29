import test from 'node:test';
import assert from 'node:assert/strict';
import {scrollClipTo,cancelClipScroll,SWIPE_SCROLL_MS} from '../../src/lib/clip-carousel-scroll.ts';

function fixture(run) {
  const saved={requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame};
  const frames=new Map();let id=0;const calls=[];
  globalThis.requestAnimationFrame=fn=>{frames.set(++id,fn);return id;};
  globalThis.cancelAnimationFrame=key=>frames.delete(key);
  const track={scrollLeft:0,scrollTo(options){calls.push(options);this.scrollLeft=options.left;}};
  try {run({track,frames,calls});} finally {cancelClipScroll(track);Object.assign(globalThis,saved);}
}
test('bottom swipe has a short fixed duration and lands precisely on its target',()=>fixture(({track,frames,calls})=>{
  const start=performance.now();scrollClipTo(track,390,'smooth',true);
  let [id,step]=frames.entries().next().value;frames.delete(id);step(start+SWIPE_SCROLL_MS/2);
  assert.ok(track.scrollLeft>0&&track.scrollLeft<390);
  [id,step]=frames.entries().next().value;frames.delete(id);step(start+SWIPE_SCROLL_MS+10);
  assert.equal(track.scrollLeft,390);assert.equal(frames.size,0);
  assert.ok(calls.every(call=>call.behavior==='instant'),'the browser does not add a second smooth-scroll animation');
}));
test('a reversed swipe cancels its old animation and cannot be moved by a stale frame',()=>fixture(({track,frames})=>{
  scrollClipTo(track,390,'smooth',true);const stale=frames.values().next().value;
  scrollClipTo(track,0,'smooth',true);assert.equal(frames.size,0);
  stale(performance.now()+1000);assert.equal(track.scrollLeft,0);
  scrollClipTo(track,780,'smooth',true);cancelClipScroll(track);assert.equal(frames.size,0);
}));
test('reduced motion stays instant and existing keyboard/joystick scroll stays native',()=>fixture(({track,frames,calls})=>{
  scrollClipTo(track,390,'instant',true);assert.equal(track.scrollLeft,390);assert.equal(frames.size,0);
  scrollClipTo(track,780,'smooth');assert.deepEqual(calls.at(-1),{left:780,behavior:'smooth'});assert.equal(frames.size,0);
}));
