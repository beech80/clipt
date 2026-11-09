import { readFile, mkdir, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { storePublicEnvironment, releaseVersion } from './ios-release-policy.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const platform = process.env.CLIPT_STORE_PLATFORM || 'ios';
if (!['ios', 'android'].includes(platform)) throw Error('Unsupported native store platform.');
const profile = platform === 'android' ? 'play-store' : 'app-store';
const publicConfig = JSON.parse(await readFile(resolve(root, 'native/store-client.json'), 'utf8'));
const env = storePublicEnvironment(publicConfig);
const version = releaseVersion(process.env.CLIPT_APP_VERSION, process.env.CLIPT_BUILD_NUMBER);
const response = await fetch(env.VITE_SUPABASE_URL + '/auth/v1/settings', {
  headers: { apikey: env.VITE_SUPABASE_ANON_KEY }, signal: AbortSignal.timeout(20000), redirect: 'error',
});
if (!response.ok) throw Error('The production public client configuration was not accepted.');
// No .env file or inherited VITE flag may accidentally activate test/billing paths.
const clean = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('VITE_')));
const envDir = await mkdtemp(resolve(tmpdir(), 'clipt-ios-public-env-'));
try {
  const build = spawnSync(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), 'build', '--mode', 'production'], {
    cwd: root, env: { ...clean, ...env, CLIPT_ISOLATED_ENV_DIR: envDir }, stdio: 'inherit', timeout: 600000,
  });
  if (build.error || build.status !== 0) throw Error('The isolated native web build failed.');
  await mkdir(resolve(root, 'outputs/' + platform + '-store'), { recursive: true });
  await writeFile(resolve(root, 'dist/clipt-native-release.json'), JSON.stringify({ profile,
    appId: 'com.slnjliheyiiummxhrgmk.clip', ...version, backend: env.VITE_SUPABASE_URL,
    broadcasting: false, purchases: false, tracking: false,
  }, null, 2) + '\n');
  console.log('Built bundled ' + profile + ' assets. No deployment, signing or submission performed.');
} finally { await rm(envDir, { recursive: true, force: true }); }
