import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('pilot playback survives status expiry and refresh without asserting stale live status', () => {
  const source = readFileSync(new URL('../../src/components/streaming/StreamDashboard.tsx', import.meta.url), 'utf8');
  assert.match(source, /setPilotPlayback\(\{ id: data\.id, url: data\.playback_url \}\)/);
  assert.match(source, /playbackUrl=\{pilotPlayback\.url\}/);
  assert.doesNotMatch(source, /playbackUrl=\{pilotFresh\?/);
  assert.match(source, /isLive=\{pilotFresh&&pilot\.data\?\.id===stream\.id&&pilot\.data\.is_live\}/);
  assert.match(source, /pilotPlayback\?\.id===stream\.id/);
  assert.match(source, /setPilotPlayback\(null\); setPilotFresh\(false\); \}, \[user\?\.id\]/);
});

test('setup identifies the actual in-app player instead of claiming no preview is connected', () => {
  const source = readFileSync(new URL('../../src/pages/StreamSetup.tsx', import.meta.url), 'utf8');
  assert.match(source, /Check Mux test status \/ playback/);
  assert.doesNotMatch(source, /No local video preview is connected/);
});

test('owner monitoring can detect idle-to-active transitions and is bounded', () => {
  const source = readFileSync(new URL('../../src/components/streaming/StreamDashboard.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /!pilot\.data\?\.is_live \|\| pilot\.isPending/);
  assert.match(source, /Date\.now\(\) >= pilotMonitorUntil/);
  assert.match(source, /setPilotMonitorUntil\(Date\.now\(\)\+300000\)/);
  assert.match(source, /if\(!document\.hidden\)checkPilot\(id\)/);
  assert.match(source, /setPilotFresh\(false\); setPilotMonitorUntil\(0\)/);
});
