import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import postcss from 'postcss';

test('narrow portrait reflows the diamond without scaling or reducing touch targets', async()=>{
  const css=postcss.parse(await readFile(new URL('../../src/components/GameBoyControls.css',import.meta.url),'utf8'));
  const rule=css.nodes.find(n=>n.params==='(orientation: portrait) and (max-width: 300px)');
  assert.ok(rule);
  const text=rule.toString();
  assert.match(text,/grid-template-columns: 52px 108px/);
  assert.match(text,/grid-template-rows: 108px 44px/);
  assert.match(text,/grid-column: 1 \/ -1/);
  assert.doesNotMatch(text,/scale\(|zoom:|overflow: hidden/);
});

test('zoom comments retain an independent sticky dismissal above scrolling content',async()=>{
  const css=await readFile(new URL('../../src/pages/clipt-console.css',import.meta.url),'utf8');
  const source=await readFile(new URL('../../src/components/post/EngagementHud.tsx',import.meta.url),'utf8');
  assert.match(source,/DialogClose asChild/);
  assert.match(source,/aria-label="Back to controls"/);
  assert.match(css,/\.clipt-comment-dock-header \{ display: flex;[^}]*position: sticky;[^}]*top: -12px/);
  assert.match(css,/\.clipt-comment-dock-close \{ display: grid;[^}]*min-width: 44px; min-height: 44px/);
});

test('narrow media grows in normal flow and small landscape reserves a smaller matching box',async()=>{
  const css=await readFile(new URL('../../src/pages/clipt-console.css',import.meta.url),'utf8');
  const viewport=await readFile(new URL('../../index.html',import.meta.url),'utf8');
  assert.match(css,/\.clipt-fyp \.clipt-cinematic-media \{ flex: none; height: auto; min-height: 120px/);
  assert.match(css,/right: calc\(204px \+ env\(safe-area-inset-right,0px\)\)/);
  assert.match(css,/\.clipt-engagement-hud\[role="dialog"\] \{ width: 180px/);
  assert.doesNotMatch(viewport,/user-scalable=no|maximum-scale=1/);
});

test('rotation reserves comments independently of expansion and gallery uses safe viewport',async()=>{
  const css=await readFile(new URL('../../src/pages/clipt-console.css',import.meta.url),'utf8');
  assert.match(css,/body:has\(\.clipt-engagement-hud\[role="dialog"\]\) \.clipt-fyp \{ right: calc\(240px/);
  assert.match(css,/body:has\(\.clipt-engagement-hud\[role="dialog"\]\) \.clipt-fyp \{ right: calc\(204px/);
  assert.match(css,/\.clipt-controller-body \{ margin-top: 48px; max-height: calc\(100% - 104px\)/);
  assert.match(css,/\.clipt-media-gallery\[role="dialog"\] \{ top: max\(12px[^}]*height: calc\(100dvh - 24px/);
  assert.match(css,/\.clipt-comment-emoji\.clipt-comment-emoji \{ z-index: 90; width: min\(256px,calc\(100vw - 24px\)\)/);
  assert.match(css,/max-height: min\(var\(--radix-popover-content-available-height/);
});

test('controller like label follows the confirmed post control rather than inventing state',async()=>{
  const source=await readFile(new URL('../../src/components/GameBoyControls.tsx',import.meta.url),'utf8');
  assert.match(source,/confirmedLikeLabel[^\n]*getAttribute\('aria-label'\)/);
  assert.match(source,/setLikeLabel\(previous => previous === confirmedLikeLabel/);
  assert.match(source,/label: likeLabel/);
  assert.match(source,/attributeFilter: \[[^\n]*'aria-label'/);
});
