import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import postcss from 'postcss';
const source=readFileSync(new URL('../../src/pages/clipt-console.css',import.meta.url),'utf8');
const finishStart=source.indexOf('/* Console finish pass:');
const finishEnd=source.indexOf('/* End console finish pass. */',finishStart);
assert.ok(finishStart>=0&&finishEnd>finishStart);
const finish=source.slice(finishStart,finishEnd);
test('console finish is valid CSS and does not change controller or feed geometry',()=>{
  assert.ok(finish);const root=postcss.parse(finish);
  root.walkRules(rule=>assert.doesNotMatch(rule.selector,/gameboy|joystick|clipt-fyp|action-buttons|clipt-controls/i));
  root.walkDecls(decl=>assert.ok(!['height','width','position','transform','z-index'].includes(decl.prop)));
});
test('console finish preserves high contrast and motion preferences',()=>{
  assert.match(finish,/html\.high-contrast[^}]*background: #000; border-color: #fff; color: #fff; box-shadow: none/s);
  assert.match(finish,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(finish,/html\.reduce-motion \.clipt-conversation-row \{ transition: none; \}/);
  assert.match(finish,/outline: 2px solid #e9d5ff; outline-offset: 3px/);
});
test('mobile typing and autofill retain readable console colors',()=>{
  assert.match(finish,/@media\(max-width:767px\)[^}]*font-size: 16px/s);
  assert.match(finish,/-webkit-text-fill-color: #f5f3ff/);
  assert.match(finish,/-webkit-box-shadow: inset 0 0 0 1000px #171025/);
});
