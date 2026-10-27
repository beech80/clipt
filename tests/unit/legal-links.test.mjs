import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const Link = ({to, children, ...props}) => React.createElement('a', {href: to, ...props}, children);
function load(path, replacements) {
  const output = ts.transpileModule(read(path), {compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  }}).outputText;
  const mod = {exports: {}};
  new Function('require', 'module', 'exports', output)(name => replacements[name] ?? require(name), mod, mod.exports);
  return mod.exports;
}
const {LegalLinks} = load('src/components/LegalLinks.tsx', {'react-router-dom': {Link}});

test('legal links render distinct, keyboard-native public destinations with touch-sized anchors', () => {
  const html = renderToStaticMarkup(React.createElement(LegalLinks));
  assert.match(html, /aria-label="Privacy and terms"/);
  assert.match(html, /href="\/privacy"/);
  assert.match(html, /href="\/terms"/);
  assert.equal((html.match(/min-h-11/g) || []).length, 2);
  assert.doesNotMatch(html, /target="_blank"|onClick|tabindex="-1"/i);
});

test('policy routes are public and previous documentation URLs redirect to canonical routes', () => {
  const app = read('src/App.tsx');
  assert.match(app, /path="\/privacy" element=\{<PrivacyPolicy \/>\}/);
  assert.match(app, /path="\/terms" element=\{<TermsOfService \/>\}/);
  assert.match(app, /path="\/docs\/privacy-policy" element=\{<Navigate to="\/privacy" replace \/>\}/);
  assert.match(app, /path="\/docs\/terms-of-service" element=\{<Navigate to="\/terms" replace \/>\}/);
});

test('signup and the shared navigation menu include legal links without changing authentication', () => {
  for (const path of ['src/pages/Signup.tsx', 'src/pages/Menu.tsx']) {
    assert.match(read(path), /<LegalLinks \/>/, path);
  }
  assert.match(read('src/pages/Signup.tsx'), /await signUp\(email, password, \{ username \}\)/);
});

test('both policies render confirmed contact details and cross-links without draft placeholders', () => {
  for (const page of ['PrivacyPolicy', 'TermsOfService']) {
    const {default: Page} = load(`src/pages/docs/${page}.tsx`, {
      'react-router-dom': {Link},
      '@/components/ui/card': {Card: ({children, ...props}) => React.createElement('section', props, children)},
      '@/components/LegalLinks': {LegalLinks},
      'remark-gfm': {default: () => {}, __esModule: true},
      'react-markdown': {default: ({children}) => React.createElement('p', null, children), __esModule: true},
      '../../../docs/PRIVACY_POLICY.md?raw': {default: read('docs/PRIVACY_POLICY.md'), __esModule: true},
    });
    const html = renderToStaticMarkup(React.createElement(Page));
    assert.match(html, /<main/);
    assert.equal((html.match(/<h1/g) || []).length, 1);
    assert.match(html, /beecher@cliptgaming\.com/);
    assert.match(html, /October 23, 2026/);
    assert.match(html, /href="\/privacy"/);
    assert.match(html, /href="\/terms"/);
    assert.doesNotMatch(html, /\[Current Date\]|\[Contact Email\]|policy draft|terms draft|cliptgaming@gmail\.com|Not approved for public release/i);
  }
});
