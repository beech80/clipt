import test from 'node:test';
import assert from 'node:assert/strict';
import { redactLogValue } from '../../src/lib/log-redaction.ts';

test('logs redact credentials and private content recursively', () => {
  const output = redactLogValue({ token: 'secret', nested: { stream_key: 'private', content: 'DM', count: 2 } });
  assert.equal(output.token, '[redacted]');
  assert.equal(output.nested.stream_key, '[redacted]');
  assert.equal(output.nested.content, '[redacted]');
  assert.equal(output.nested.count, 2);
});
test('logs omit URL query credentials and bearer values', () => {
  assert.equal(redactLogValue('https://example.com/path?token=private#secret'), 'https://example.com/path');
  assert.equal(redactLogValue('Bearer private-token'), 'Bearer [redacted]');
});
test('logs bound cyclic data and invalid numbers', () => {
  const cycle = {}; cycle.next = cycle;
  assert.doesNotThrow(() => JSON.stringify(redactLogValue(cycle)));
  assert.equal(redactLogValue(Infinity), null);
});
