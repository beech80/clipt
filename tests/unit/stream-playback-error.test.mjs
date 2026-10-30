import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const source=readFileSync(new URL('../../src/lib/streamPlaybackError.ts',import.meta.url),'utf8');
const {streamPlaybackError}=await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
test('playback diagnostics distinguish network HTTP and decode failures without exposing raw values',()=>{
  assert.match(streamPlaybackError('networkError',404),/HTTP 404/);
  assert.match(streamPlaybackError('mediaError'),/decoding/);
  assert.match(streamPlaybackError('unsupported'),/does not support/);
  assert.match(streamPlaybackError('sourceError'),/does not prove/);
  assert.doesNotMatch(streamPlaybackError('https://secret.example/token','secret'),/secret/);
  assert.doesNotMatch(streamPlaybackError('networkError',NaN),/HTTP/);
});
test('HLS uses MSE when available and retains native fallback for browsers without MSE',()=>{
  const player=readFileSync(new URL('../../src/components/streaming/StreamPlayer.tsx',import.meta.url),'utf8');
  assert.match(player,/if \(isHls && Hls\.isSupported\(\)\)/);
  assert.match(player,/else if \(!isHls \|\| video\.canPlayType/);
  assert.doesNotMatch(player,/code === 4 \? 'unsupported'/);
});
test('pilot does not show unsynchronized health or legacy credentials and chat is not squeezed beside video',()=>{
  const dashboard=readFileSync(new URL('../../src/components/streaming/StreamDashboard.tsx',import.meta.url),'utf8');
  assert.match(dashboard,/compact showHealth=\{false\}/);
  assert.match(dashboard,/\{!testLivePilot && <>/);
  assert.match(dashboard,/streamId=\{stream\.id\} manual/);
});
