import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const root=new URL('../../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const manifest=JSON.parse(read('package.json'));
const lock=JSON.parse(read('package-lock.json'));

// These are source/lockfile contracts. A clean audit, successful compiler run
// and hosted visual/playback checks require their own independent evidence.
test('resolved build graph removes the vulnerable Tailwind3 dependency chain',()=>{
  const removed=new Set(['braces','micromatch','fast-glob','anymatch','lovable-tagger']);
  for(const [path,pkg] of Object.entries(lock.packages)){
    if(!path)continue;
    const name=path.split('node_modules/').at(-1);
    assert.equal(removed.has(name),false,`Unexpected legacy build package: ${path}`);
    if(name==='tailwindcss')assert.match(pkg.version,/^4\./,`Legacy Tailwind resolved at ${path}`);
  }
  for(const name of removed){
    assert.equal(manifest.dependencies?.[name],undefined,`${name} remains a runtime dependency`);
    assert.equal(manifest.devDependencies?.[name],undefined,`${name} remains a build dependency`);
  }
});

test('Tailwind and its official Vite plugin use the same exact reviewed version',()=>{
  for(const name of ['tailwindcss','@tailwindcss/vite']){
    const version=manifest.devDependencies[name];
    assert.match(version,/^4\.\d+\.\d+$/,'Build versions must be exact, not ranges');
    assert.equal(lock.packages[''].devDependencies[name],version);
    assert.equal(lock.packages[`node_modules/${name}`].version,version);
  }
  assert.equal(manifest.devDependencies.tailwindcss,manifest.devDependencies['@tailwindcss/vite']);
});

test('Vite stays on the reviewed security-patched 7.x release',()=>{
  assert.equal(manifest.devDependencies.vite,'7.3.7');
  assert.equal(lock.packages['node_modules/vite'].version,'7.3.7');
});

test('Vite uses the maintained Tailwind integration with the approved compatibility theme',()=>{
  const vite=read('vite.config.ts');
  const postcss=read('postcss.config.js');
  const css=read('src/index.css');
  assert.match(vite,/import tailwindcss from ['"]@tailwindcss\/vite['"]/);
  assert.match(vite,/plugins:\s*\[react\(\),\s*tailwindcss\(\)\]/);
  assert.doesNotMatch(vite,/lovable-tagger|componentTagger/);
  assert.doesNotMatch(postcss,/\btailwindcss\s*:/,'Legacy PostCSS plugin must not also run');
  assert.match(css,/@import "tailwindcss" source\(none\);/);
  assert.match(css,/@config "\.\.\/tailwind\.config\.ts";/);
  assert.match(css,/@import "\.\/styles\/tailwind-v3-compat\.css";/);
  assert.match(css,/@source "\.\/";/);
  assert.ok(read('src/styles/tailwind-v3-compat.css').includes('@theme'));
});

test('shared dialogs retain a single CSS transform instead of compounded individual translations',()=>{
  for(const path of ['src/components/ui/dialog.tsx','src/components/ui/alert-dialog.tsx']){
    const source=read(path);
    assert.match(source,/clipt-dialog-content/);
    assert.doesNotMatch(source,/\btranslate-[xy]-\[/,'Page dock transforms must not compound individual translate');
  }
  assert.match(read('src/index.css'),/\.clipt-dialog-content\s*\{\s*transform:\s*translate\(-50%,\s*-50%\);\s*\}/);
});

test('build migration preserves classic landscape and explicit opt-in vertical accessibility behavior',()=>{
  const exports={};
  const output=ts.transpileModule(read('src/lib/controller-layout.ts'),{
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},
  }).outputText;
  new Function('exports',output)(exports);
  const {controllerLayout,readControllerPreferences}=exports;
  assert.equal(readControllerPreferences(null).portraitZoom,false);
  assert.equal(controllerLayout(390,660,false,'auto'),'classic');
  assert.equal(controllerLayout(312,528,false,'auto'),'classic');
  assert.equal(controllerLayout(390,660,false,'auto',true),'classic');
  assert.equal(controllerLayout(312,528,false,'auto',true),'immersive');
  assert.equal(controllerLayout(844,390,true,'auto'),'classic');
  assert.equal(controllerLayout(675,312,true,'classic'),'immersive');
});

test('unused PWA tooling cannot reintroduce the deepmerge advisory chain',()=>{
  assert.equal(manifest.devDependencies['vite-plugin-pwa'],undefined);
  assert.equal(lock.packages[''].devDependencies['vite-plugin-pwa'],undefined);
  for(const path of Object.keys(lock.packages)){
    const name=path.split('node_modules/').at(-1);
    assert(!['vite-plugin-pwa','workbox-build','deepmerge'].includes(name),'Unused vulnerable build chain: '+path);
  }
  assert.doesNotMatch(read('vite.config.ts'),/VitePWA|vite-plugin-pwa/);
});
