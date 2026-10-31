import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../../',import.meta.url));
test('patched matching dependencies support the existing TypeScript ESLint configuration',async()=>{
 const {ESLint}=await import('eslint');
 const eslint=new ESLint({cwd:root});
 const config=await eslint.calculateConfigForFile('src/App.tsx');
 assert.ok(config?.languageOptions?.parser,'existing TypeScript parser must load');
 const results=await eslint.lintText('export const ready: boolean = true;\n',{filePath:'src/native-toolchain-smoke.ts'});
 assert.equal(results.reduce((count,result)=>count+result.fatalErrorCount,0),0);
});
test('patched glob preserves file discovery and rejects cancelled walks',async()=>{
 const {glob}=await import('glob');
 assert.deepEqual(await glob('src/App.tsx',{cwd:root}),['src/App.tsx']);
 const controller=new AbortController();controller.abort();
 await assert.rejects(glob('src/**',{cwd:root,signal:controller.signal}),error=>error.name==='AbortError');
});
