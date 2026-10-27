import test from 'node:test';
import assert from 'node:assert/strict';
import { collectSearchResults } from '../../src/lib/search-results.ts';

const empty = () => ({ posts: [], profiles: [], streams: [] });
test('filtered search retains its category when preceding categories are absent', async () => {
  for (const category of ['posts', 'profiles', 'streams']) {
    const result = await collectSearchResults(empty(), { [category]: Promise.resolve({ data: [{ id: category }], error: null }) });
    assert.deepEqual(result, { ...empty(), [category]: [{ id: category }] });
  }
});
test('search completion order does not alter categories', async () => {
  const result = await collectSearchResults(empty(), {
    posts: new Promise(resolve => setTimeout(() => resolve({ data: [{ id: 'post' }], error: null }), 10)),
    streams: Promise.resolve({ data: [{ id: 'stream' }], error: null }),
    profiles: Promise.resolve({ data: null, error: null }),
  });
  assert.deepEqual(result, { posts: [{ id: 'post' }], profiles: [], streams: [{ id: 'stream' }] });
});
test('search errors are not silently converted to empty results', async () => {
  await assert.rejects(collectSearchResults(empty(), { profiles: Promise.resolve({ data: null, error: new Error('Denied') }) }), /Denied/);
});
