import test from 'node:test';
import assert from 'node:assert/strict';
import { publicAppUrl, PUBLIC_CLIPT_ORIGIN } from '../../src/lib/public-app-url.ts';
test('native post shares open the real website while web shares preserve their current origin', () => {
  assert.equal(publicAppUrl('/post/clip-id', 'capacitor://localhost'), PUBLIC_CLIPT_ORIGIN + '/post/clip-id');
  assert.equal(publicAppUrl('capacitor://localhost/post/clip-id', 'capacitor://localhost'), PUBLIC_CLIPT_ORIGIN + '/post/clip-id');
  assert.equal(publicAppUrl('/post/clip-id', 'https://preview.example'), 'https://preview.example/post/clip-id');
  assert.equal(publicAppUrl('https://external.example/post/clip-id', 'capacitor://localhost'), 'https://external.example/post/clip-id');
  assert.equal(publicAppUrl('https://localhost/post/clip-id', PUBLIC_CLIPT_ORIGIN, true), PUBLIC_CLIPT_ORIGIN + '/post/clip-id');
  assert.equal(publicAppUrl('/post/clip-id', 'http://127.0.0.1:8081'), 'http://127.0.0.1:8081/post/clip-id');
  assert.throws(() => publicAppUrl('javascript:alert(1)', 'capacitor://localhost'));
});
