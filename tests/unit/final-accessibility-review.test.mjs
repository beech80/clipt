import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const source = path => readFileSync(new URL(`../../src/${path}`, import.meta.url), 'utf8');

test('post navigation uses keyboard-native controls and names the options menu', () => {
  const file = ts.createSourceFile('PostItem.tsx', source('components/PostItem.tsx'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let profileButtons = 0;
  let gameButtons = 0;
  let namedOptions = false;
  function visit(node) {
    if (ts.isJsxOpeningElement(node)) {
      const click = node.attributes.properties.find(p => ts.isJsxAttribute(p) && p.name.text === 'onClick');
      const text = click?.getText(file) || '';
      if (text.includes('handleProfileClick')) { assert.equal(node.tagName.getText(file), 'button'); profileButtons++; }
      if (text.includes('handleGameClick')) { assert.equal(node.tagName.getText(file), 'button'); gameButtons++; }
      if (node.tagName.getText(file) === 'DropdownMenuTrigger') namedOptions ||= node.attributes.getText(file).includes('aria-label="Post options"');
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  assert.equal(profileButtons, 3);
  assert.equal(gameButtons, 1);
  assert.ok(namedOptions);
});

test('global report dialog restores a connected opener without overriding focus after navigation', () => {
  const report = source('components/report/ReportDialog.tsx');
  assert.match(report, /useState<HTMLElement \| null>\(\(\) =>/);
  assert.match(report, /document\.activeElement !== document\.body/);
  assert.match(report, /onCloseAutoFocus=\{event => \{\s*if \(returnFocusTo\?\.isConnected\) \{ event\.preventDefault\(\); returnFocusTo\.focus\(\); \}/);
});

for (const path of ['components/post/EngagementHud.tsx', 'components/profile/ProfileConnectionsDialog.tsx']) {
  test(`${path} restores its connected keyboard opener and leaves detached targets alone`, () => {
    const text = source(path);
    assert.match(text, /document\.activeElement !== document\.body/);
    const file = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let handler;
    const trigger = {isConnected: true, focused: false, getClientRects:()=>[{}], focus() {this.focused = true;}};
    const toggle = {isConnected:true,focused:false,getClientRects:()=>[{}],focus(){this.focused=true;}};
    function visit(node) {
      if (ts.isJsxAttribute(node) && node.name.text === 'onCloseAutoFocus') {
        const expression = node.initializer.expression.getText(file);
        const compiled=ts.transpileModule(`const fn=${expression}`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
        handler = new Function('returnFocusTo','document','followFeed', `${compiled};return fn;`)(trigger,{querySelector:()=>toggle},false);
      }
      ts.forEachChild(node, visit);
    }
    visit(file);
    assert.equal(typeof handler, 'function');
    let prevented = false;
    handler({preventDefault() {prevented = true;}});
    assert.ok(prevented && trigger.focused);
    trigger.isConnected = false; prevented = false; trigger.focused = false;
    handler({preventDefault() {prevented = true;}});
    assert.ok(!prevented && !trigger.focused);
    if(path.includes('EngagementHud')) {
      trigger.isConnected=true;trigger.getClientRects=()=>[];
      handler({preventDefault(){prevented=true;}});
      assert.ok(prevented&&toggle.focused,'rotated hidden opener returns focus to visible controller toggle');
    }
  });
}

test('narrow Settings grid can shrink and long action labels wrap without resizing switches', () => {
  const css = source('pages/clipt-console.css');
  assert.match(css, /\.clipt-settings-layout \{[^}]*grid-template-columns: minmax\(0,1fr\)/);
  assert.match(css, /\.clipt-settings-layout > \* \{ min-width: 0; \}/);
  assert.match(css, /\.clipt-settings button:not\(\[role="switch"\]\) \{[^}]*min-height: 44px;[^}]*white-space: normal;/);
});

test('all recipient-picker entry points capture the actual trigger before opening', () => {
  const messages = source('pages/Messages.tsx');
  const file = ts.createSourceFile('Messages.tsx', messages, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const opener = {current: null};
  let opened = 0, entryPoints = 0, closeHandler;
  const trigger = {isConnected: true, focused: false, focus() {this.focused = true;}};
  function visit(node) {
    if (ts.isJsxAttribute(node) && node.initializer && ts.isJsxExpression(node.initializer)) {
      const expression = node.initializer.expression?.getText(file) || '';
      if (node.name.text === 'onClick' && expression.includes('setShowNewChatDialog(true)')) {
        const handler = new Function('newChatOpener','setShowNewChatDialog',`return (${expression});`)(opener, value => {assert.equal(opener.current, trigger); assert.equal(value, true); opened++;});
        opener.current = null;
        handler({currentTarget: trigger});
        entryPoints++;
      }
      if (node.name.text === 'onCloseAutoFocus' && expression.includes('newChatOpener')) closeHandler = new Function('newChatOpener',`return (${expression});`)(opener);
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  assert.equal(entryPoints, 3);
  assert.equal(opened, 3);
  let prevented = false;
  closeHandler({preventDefault() {prevented = true;}});
  assert.ok(prevented && trigger.focused);
  trigger.isConnected = false; prevented = false; trigger.focused = false;
  closeHandler({preventDefault() {prevented = true;}});
  assert.ok(!prevented && !trigger.focused);
  assert.doesNotMatch(messages, /newChatOpener\.current = document\.activeElement/);
});
