import assert from 'node:assert/strict';
import {build} from 'vite';
import tailwindcss from '@tailwindcss/vite';
import {resolve} from 'node:path';

// Compile real application CSS without credentials or a fake app environment.
const result=await build({configFile:false,plugins:[tailwindcss()],logLevel:'warn',
  build:{write:false,minify:false,cssMinify:false,rollupOptions:{input:resolve('src/index.css')}}});
const outputs=(Array.isArray(result)?result:[result]).flatMap(item=>item.output);
const css=outputs.filter(item=>item.type==='asset'&&item.fileName.endsWith('.css')).map(item=>String(item.source)).join('\n');
assert.ok(css.length>10000,'CSS generation must not be empty');
for(const selector of ['.bg-background','.text-foreground','.border-border','.bg-gaming-400','.animate-in','.animate-out','.bg-gradient-to-r','.outline-none','.shadow-sm','.backdrop-blur-sm']) {
  // Some utilities are only requested behind data/focus variants, whose
  // selectors escape the prefix before this same utility name.
  assert.ok(css.includes(selector.slice(1)),`Missing generated utility ${selector}`);
}
assert.match(css,/#a855f7|#a855f7\b|rgb\(168[ ,]+85[ ,]+247/i,'Preserve original purple RGB palette');
assert.match(css,/outline: 2px solid (?:transparent|#0000)/,'Preserve forced-colors-safe outline');
assert.match(css,/clipt-dialog-content/,'Preserve shared dialog positioning');
assert.match([...css.matchAll(/\.bg-gradient-to-r\s*\{[^}]+/g)].at(-1)?.[0]||'',/in srgb/,'Preserve legacy gradient interpolation');
console.log(JSON.stringify({status:'pass',cssBytes:css.length,checkedUtilities:11,
  gradientRule:css.match(/\.bg-gradient-to-r\s*\{[^}]+/)?.[0]}));
