import test from 'node:test';
import assert from 'node:assert/strict';
import { feedVideoFit } from '../../src/lib/feed-video-fit.ts';
test('horizontal videos fit in portrait and portrait videos fit in landscape', () => {
  assert.equal(feedVideoFit(false, false), 'contain');
  assert.equal(feedVideoFit(true, true), 'contain');
  assert.equal(feedVideoFit(true, false), 'cover');
  assert.equal(feedVideoFit(false, true), 'cover');
  assert.equal(feedVideoFit(undefined, false), 'contain');
  assert.equal(feedVideoFit(undefined, true), 'contain');
});
