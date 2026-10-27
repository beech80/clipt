import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAvatarHeader, AVATAR_MAX_BYTES } from '../../src/lib/avatar-upload.ts';
test('avatar validation accepts matching raster image signatures', () => {
  assert.doesNotThrow(() => validateAvatarHeader(new Uint8Array([255, 216, 255]), 'image/jpeg', 100));
  assert.doesNotThrow(() => validateAvatarHeader(new Uint8Array([137,80,78,71,13,10,26,10]), 'image/png', 100));
  assert.doesNotThrow(() => validateAvatarHeader(new TextEncoder().encode('RIFF0000WEBP'), 'image/webp', 100));
});
test('avatar validation rejects spoofed, active and oversized uploads', () => {
  for (const [bytes, mime, size] of [
    [new Uint8Array([255,216,255]), 'image/png', 100],
    [new TextEncoder().encode('<svg></svg>'), 'image/svg+xml', 100],
    [new Uint8Array([255,216,255]), 'image/jpeg', AVATAR_MAX_BYTES + 1],
    [new Uint8Array(), 'image/jpeg', 0],
  ]) assert.throws(() => validateAvatarHeader(bytes, mime, size));
});
