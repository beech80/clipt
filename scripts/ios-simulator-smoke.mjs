import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { APP_ID } from './ios-release-policy.mjs';

if (process.platform !== 'darwin') throw Error('The native simulator check requires macOS and Xcode.');
function run(args, timeout = 120000) {
  const result = spawnSync('xcrun', ['simctl', ...args], { encoding: 'utf8', timeout });
  if (result.error || result.status !== 0) throw Error('Simulator command failed: ' + args[0]);
  return result.stdout;
}
const available = JSON.parse(run(['list', 'devices', 'available', '-j']));
const device = Object.entries(available.devices).filter(([runtime]) => /iOS-(?:2[6-9]|[3-9]\d)-/.test(runtime))
  .flatMap(([, devices]) => devices).find(item => item.name.startsWith('iPhone') && item.isAvailable);
if (!device || !/^[A-F0-9-]{36}$/i.test(device.udid)) throw Error('A current available iPhone simulator is required.');
if (device.state !== 'Booted') run(['boot', device.udid]);
run(['bootstatus', device.udid, '-b'], 240000);
run(['install', device.udid, resolve('outputs/ios-store/simulator/Build/Products/Debug-iphonesimulator/App.app')]);
run(['launch', '--terminate-running-process', device.udid, APP_ID]);
await new Promise(done => setTimeout(done, 15000));
const processes = run(['spawn', device.udid, 'launchctl', 'list']);
if (!processes.split('\n').some(line => line.includes(APP_ID) && /^\d+\s/.test(line))) throw Error('The app process did not stay running after launch.');
await mkdir('outputs/ios-store', { recursive: true });
run(['io', device.udid, 'screenshot', resolve('outputs/ios-store/simulator-welcome.png')]);
await writeFile('outputs/ios-store/SIMULATOR-INFO.json', JSON.stringify({ device: device.name,
  appId: APP_ID, installed: true, launched: true, stayedRunning: true,
  screenshot: 'simulator-welcome.png', authenticatedFlowsVerified: false, physicalDeviceVerified: false,
}, null, 2) + '\n');
console.log('Native simulator install and launch passed; inspect its screenshot. Physical acceptance remains required.');
