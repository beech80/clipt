import test from 'node:test';
import assert from 'node:assert/strict';
import { notificationLink } from '../../src/lib/notification-link.ts';

const id = '00000000-0000-4000-8000-000000000099';
test('notification resources resolve to existing application routes', () => {
  assert.equal(notificationLink('profile', id), `/user/${id}`);
  assert.equal(notificationLink('stream', id), `/streaming/${id}`);
  assert.equal(notificationLink('post', id), `/post/${id}`);
});
test('notifications reject unknown and malformed navigation targets', () => {
  for (const target of [null, '', '../admin', 'https://example.invalid', 'javascript:alert(1)']) {
    assert.equal(notificationLink('profile', target), null);
  }
  assert.equal(notificationLink('unknown', id), null);
});
