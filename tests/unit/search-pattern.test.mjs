import test from 'node:test';
import assert from 'node:assert/strict';
import {searchPattern} from '../../src/lib/search-pattern.ts';
test('search treats wildcard characters as literal text',()=>{
 assert.equal(searchPattern('100%_done'),'%100\\%\\_done%');
 assert.equal(searchPattern('a\\b'),'%a\\\\b%');
 assert.equal(searchPattern('clipt'),'%clipt%');
});
