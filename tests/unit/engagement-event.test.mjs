import test from 'node:test';
import assert from 'node:assert/strict';
import { readEngagementUpdate } from '../../src/lib/engagement-event.ts';

test('engagement events accept validated updates for the matching post', () => {
  assert.deepEqual(readEngagementUpdate({ postId: 'a', active: true, count: 12 }, 'a'), { active: true, count: 12 });
  assert.deepEqual(readEngagementUpdate({ postId: 'a', active: false, count: 0 }, 'a'), { active: false, count: 0 });
});

test('engagement events reject other posts and malformed counters', () => {
  for (const value of [null, [], 'bad', {}, { postId: 'b', active: true, count: 1 },
    ...[-1, 0.5, NaN, Infinity, '1', Number.MAX_SAFE_INTEGER + 1].map(count => ({ postId: 'a', active: true, count })),
    { postId: 'a', active: 'true', count: 1 }]) {
    assert.equal(readEngagementUpdate(value, 'a'), null);
  }
});
