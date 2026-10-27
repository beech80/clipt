import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';

test('application runtime does not import the audited CSS/glob build tools',async()=>{
  const root=new URL('../../src/',import.meta.url);
  const tools='(?:tailwindcss(?:/[^\s\"\']*)?|postcss(?:/[^\s\"\']*)?|postcss-selector-parser|braces|micromatch|chokidar|fast-glob|lovable-tagger)';
  const imports=new RegExp('(?:from\\s*|import\\s*\\(?|require\\s*\\()'+"['\"]"+tools+"['\"]");
  async function inspect(dir){
    for(const entry of await readdir(dir,{withFileTypes:true})){
      const file=new URL(entry.name+(entry.isDirectory()?'/':''),dir);
      if(entry.isDirectory())await inspect(file);
      else if(/\.[cm]?[jt]sx?$/.test(entry.name))assert.equal(imports.test(await readFile(file,'utf8')),false,'Build-tool runtime import: '+file.pathname);
    }
  }
  await inspect(root);
});
