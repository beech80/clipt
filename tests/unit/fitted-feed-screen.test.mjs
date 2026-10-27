import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import postcss from 'postcss';
test('only mounted Clipts locks document scrolling and retains native carousel and comment scroll',()=>{
  const source=readFileSync(new URL('../../src/pages/clipt-console.css',import.meta.url),'utf8');
  const css=postcss.parse(source);
  const lock=css.nodes.find(n=>n.selector?.startsWith('html:has(.clipt-fyp),'));
  assert.ok(lock);assert.match(lock.toString(),/overflow: hidden !important/);
  assert.match(lock.selector,/body:has\(\.clipt-fyp\) #root/);
  const fitted=css.nodes.find(n=>n.params==='(orientation: portrait), (min-height: 501px)');
  assert.ok(fitted);assert.match(fitted.toString(),/position: fixed/);
  assert.match(fitted.toString(),/grid-template-rows: auto auto minmax\(0,1fr\) auto/);
  assert.match(fitted.toString(),/min-height: 0 !important/);
  assert.match(source,/scroll-snap-type: x mandatory/);
  assert.match(source,/overflow-y: auto; overscroll-behavior: contain/);
  assert.doesNotMatch(source,/user-scalable=no|touch-action: none;.*clipt-fyp/);
});
