import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import postcss from 'postcss';
const source=readFileSync(new URL('../../src/pages/clipt-immersion.css',import.meta.url),'utf8');
const root=postcss.parse(source);
test('immersive CSS is loaded and changes no layout, controller or video transforms',()=>{
  assert.match(readFileSync(new URL('../../src/pages/clipt-console.css',import.meta.url),'utf8'),/^@import '\.\/clipt-immersion\.css';/);
  root.walkRules(rule=>assert.doesNotMatch(rule.selector,/gameboy|joystick|action-buttons|clipt-controls|\bvideo\b|\bimg\b/));
  root.walkDecls(decl=>assert.ok(!['height','width','position','transform','z-index','pointer-events','overflow','touch-action','scroll-snap-type','opacity'].includes(decl.prop),decl.prop));
});
test('immersive surfaces override earlier finish without losing high contrast',()=>{
  assert.ok(root.nodes.some(rule=>rule.selector==='.app-container.app-container'));
  assert.match(source,/\.page-content\.page-content :is\(\.gaming-card,\.glass-card\)/);
  assert.match(source,/html\.high-contrast \.app-container\.app-container/);
  assert.match(source,/background: #000; color: #fff; border-color: #fff; box-shadow: none/);
});
test('immersion uses confirmed active clip state without dimming or rearranging media',()=>{
  const post=readFileSync(new URL('../../src/components/PostItem.tsx',import.meta.url),'utf8');
  assert.match(post,/data-active-clip=\{cinematic \? String\(active\)/);
  assert.match(source,/article\[data-active-clip="true"\]/);
  assert.match(source,/article\[data-active-clip="false"\]/);
});
test('immersion avoids continuous animation and preserves motion/touch preferences',()=>{
  assert.doesNotMatch(source,/@keyframes|\banimation:|backdrop-filter|url\(/);
  assert.match(source,/@media\(hover:hover\) and \(pointer:fine\)/);
  assert.match(source,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(source,/html\.reduce-motion/);
  assert.match(source,/:not\(:disabled\):active/);
});
