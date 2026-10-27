import test from 'node:test';
import assert from 'node:assert/strict';
import { createBucketIfNotExists } from '../../src/lib/storage.ts';

test('legacy browser storage provisioning fails closed without requesting bucket access', async () => {
  await assert.rejects(createBucketIfNotExists(), /Storage provisioning is unavailable in the browser/);
});
