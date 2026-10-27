import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('crash boundary logs a generic event without raw errors, component stacks or URLs',()=>{
 const source=readFileSync(new URL('../../src/components/ErrorBoundary.tsx',import.meta.url),'utf8');
 const body=source.split('componentDidCatch(')[1].split('handleRetry')[0];
 assert.match(body,/console\.error\('CLIPT render failure'\)/);
 assert.doesNotMatch(body,/console\.error\([^;]*(?:errorInfo|error\s*[,)]|\.stack)/);
});
