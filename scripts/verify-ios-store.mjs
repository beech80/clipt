import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';
import { APP_ID, storePrivacyManifest } from './ios-release-policy.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(resolve(root, 'node_modules/@capacitor/cli/package.json'));
const plist = require('plist');
const archive = process.argv[2];
const app = archive ? resolve(archive, 'Products/Applications/App.app') : resolve(root, 'ios/App/App');
async function readPlist(path) {
  if (!archive) return plist.parse(await readFile(path, 'utf8'));
  const decoded = spawnSync('plutil', ['-convert', 'xml1', '-o', '-', path], { encoding: 'utf8' });
  if (decoded.status !== 0) throw Error('An archived property list could not be decoded.');
  return plist.parse(decoded.stdout);
}
const info = await readPlist(resolve(app, 'Info.plist'));
function check(ok, message) { if (!ok) throw Error(message); }
check(info.CLIPTReleaseProfile === 'app-store' && info.CLIPTNativeBroadcastEnabled === false, 'Release profile must disable native broadcasting.');
check(!info.UIBackgroundModes?.length && !info.NSScreenCaptureUsageDescription, 'Experimental background/capture modes are forbidden.');
check(info.CFBundleURLTypes?.some(type => type.CFBundleURLSchemes?.includes(APP_ID)), 'The exact native auth callback is missing.');
for (const key of ['NSCameraUsageDescription','NSMicrophoneUsageDescription','NSPhotoLibraryUsageDescription']) check(Boolean(info[key]), 'A media permission description is missing.');
const privacy = await readPlist(resolve(app, 'PrivacyInfo.xcprivacy'));
check(isDeepStrictEqual(privacy, storePrivacyManifest()), 'The app privacy manifest does not match the reviewed policy.');
const capacitor = JSON.parse(await readFile(resolve(app, 'capacitor.config.json'), 'utf8'));
check(capacitor.appId === APP_ID && !capacitor.server?.url && !capacitor.server?.cleartext && capacitor.loggingBehavior === 'none', 'The native shell must use bundled assets without remote navigation or logging.');
check(!capacitor.packageClassList?.includes('CliptBroadcasterPlugin'), 'The experimental capture plugin must not be registered.');
check(capacitor.packageClassList?.includes('AppPlugin'), 'Native lifecycle/deep linking plugin was not bundled.');
const publicDir = resolve(app, 'public');
const receipt = JSON.parse(await readFile(resolve(publicDir, 'clipt-native-release.json'), 'utf8'));
check(receipt.profile === 'app-store' && receipt.backend === 'https://slnjliheyiiummxhrgmk.supabase.co'
  && !receipt.broadcasting && !receipt.purchases && !receipt.tracking, 'Wrong bundled release configuration.');
const files = await readdir(resolve(publicDir, 'assets'));
const js = (await Promise.all(files.filter(name => name.endsWith('.js')).map(name => readFile(resolve(publicDir, 'assets', name), 'utf8')))).join('\n');
check(js.includes('https://slnjliheyiiummxhrgmk.supabase.co'), 'Production backend is absent from the bundle.');
// Literal dev URLs can exist in guards. Server credentials and private key material cannot.
check(!/sb_secret_[A-Za-z0-9_-]{16,}|-----BEGIN (?:RSA )?PRIVATE KEY-----/.test(js), 'Server credential material found in bundled JavaScript.');
if (archive) {
  check(info.CFBundleIdentifier === APP_ID && Number(info.DTSDKName?.match(/iphoneos(\d+)/)?.[1]) >= 26, 'Archive needs the correct app ID and an iOS 26+ SDK.');
  check(Number(info.MinimumOSVersion) >= 16, 'The store app requires iOS/iPadOS 16+ for the existing web UI.');
  const linked = spawnSync('otool', ['-L', resolve(app, info.CFBundleExecutable)], { encoding: 'utf8' });
  check(linked.status === 0 && !/CliptBroadcaster|HaishinKit|Logboard/.test(linked.stdout), 'Experimental broadcaster must not be linked into the release.');
  const strings = spawnSync('strings', [resolve(app, info.CFBundleExecutable)], { encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 });
  check(strings.status === 0 && !/CLIPT-native-smoke[.]json|CliptBroadcaster|HaishinKit/.test(strings.stdout), 'Debug UI probes and experimental capture code must be excluded from the Release binary.');
}
const commit = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim();
await mkdir(resolve(root, 'outputs/ios-store'), { recursive: true });
await writeFile(resolve(root, 'outputs/ios-store/BUILD-INFO.json'), JSON.stringify({ sourceCommit: commit,
  ...receipt, archiveChecked: Boolean(archive), signed: false, physicalDeviceVerified: false,
  submittedToApple: false, webBetaDeployed: false, ownerApprovalRequired: true,
}, null, 2) + '\n');
console.log('App Store package checks passed. Signing, physical-device acceptance and Apple review remain required.');
