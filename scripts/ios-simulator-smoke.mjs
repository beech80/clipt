import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { APP_ID, selectStoreSimulator } from './ios-release-policy.mjs';

if (process.platform !== 'darwin') throw Error('The native simulator check requires macOS and Xcode.');
function run(args, timeout = 120000) {
  const result = spawnSync('xcrun', ['simctl', ...args], { encoding: 'utf8', timeout });
  if (result.error || result.status !== 0) {
    console.error(JSON.stringify({ command: args[0], exit: result.status, signal: result.signal,
      error: result.error?.code, detail: (result.stderr || result.stdout || '').slice(-1000) }));
    throw Error('Simulator command failed: ' + args[0]);
  }
  return result.stdout;
}
const available = JSON.parse(run(['list', 'devices', 'available', '-j']));
const device = selectStoreSimulator(available.devices);
if (!device || !/^[A-F0-9-]{36}$/i.test(device.udid)) throw Error('A current available iPhone simulator is required.');
console.log('Selected ' + device.name + ' on ' + device.runtime);
const ui = spawnSync('open', ['-a', 'Simulator', '--args', '-CurrentDeviceUDID', device.udid], { encoding: 'utf8', timeout: 30000 });
if (ui.error || ui.status !== 0) throw Error('The Simulator application could not start.');
// Simulator.app may already have booted this device since it was listed.
// bootstatus -b boots only if needed and also waits for that existing boot.
run(['bootstatus', device.udid, '-b'], 240000);
run(['install', device.udid, resolve('outputs/ios-store/simulator/Build/Products/Debug-iphonesimulator/App.app')]);
run(['launch', '--terminate-running-process', device.udid, APP_ID]);
await new Promise(done => setTimeout(done, 15000));
const container = run(['get_app_container', device.udid, APP_ID, 'data']).trim();
let uiState;
for (let attempt = 0; attempt < 20; attempt++) {
  try { uiState = JSON.parse(await readFile(resolve(container, 'Library/Caches/CLIPT-native-smoke.json'), 'utf8')); } catch { /* Wait for bundled UI and native listeners. */ }
  if (uiState?.bridgeReady && uiState?.welcomeVisible) break;
  await new Promise(done => setTimeout(done, 3000));
}
const expectedBuild = process.env.CLIPT_BUILD_NUMBER || JSON.parse(await readFile('dist/clipt-native-release.json', 'utf8')).build;
const processes = run(['spawn', device.udid, 'launchctl', 'list']);
const stayedRunning = processes.split('\n').some(line => line.includes(APP_ID) && /^\d+\s/.test(line.trimStart()));
await mkdir('outputs/ios-store', { recursive: true });
run(['io', device.udid, 'screenshot', resolve('outputs/ios-store/simulator-welcome.png')]);
await writeFile('outputs/ios-store/SIMULATOR-INFO.json', JSON.stringify({ device: device.name, runtime: device.runtime,
  appId: APP_ID, installed: true, launched: true, stayedRunning,
  nativeBridgeReady: uiState?.bridgeReady === true, welcomeRendered: uiState?.welcomeVisible === true,
  buildMatches: uiState?.build === expectedBuild,
  screenshot: 'simulator-welcome.png', authenticatedFlowsVerified: false, physicalDeviceVerified: false,
}, null, 2) + '\n');
if (!uiState?.bridgeReady || !uiState?.welcomeVisible || uiState.build !== expectedBuild || !stayedRunning)
  throw Error('The native bridge, visible welcome screen and running process were not verified for this build. Inspect SIMULATOR-INFO.json and simulator-welcome.png.');
console.log('Native simulator install and launch passed; inspect its screenshot. Physical acceptance remains required.');
