import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import postcss from 'postcss';

test('floating cards preserve scrolling and respect reduced motion and contrast',async()=>{
 const css=await readFile(new URL('../../src/pages/clipt-console.css',import.meta.url),'utf8');
 postcss.parse(css);
 const section=css.slice(css.indexOf('/* Floating Clipt cards:'),css.indexOf('/* Landscape theater'));
 assert.match(section,/translateY\(-4px\)/);
 assert.match(section,/prefers-reduced-motion: no-preference/);
 assert.match(section,/html:not\(\.reduce-motion\)/);
 assert.match(section,/:focus-within \{ animation-play-state: paused/);
 assert.match(section,/html.high-contrast .*box-shadow: none/);
 assert.doesNotMatch(section,/\.clipt-controller|height:|width:|scroll-snap/);
});
