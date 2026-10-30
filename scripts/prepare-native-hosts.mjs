import { readFile, writeFile, access, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const platform = process.argv[2];
if (!['ios', 'android'].includes(platform)) throw Error('Choose ios or android.');
const cliPackage = resolve(root, 'node_modules/@capacitor/cli/package.json');
const version = JSON.parse(await readFile(cliPackage, 'utf8')).version;
if (version !== '8.6.0') throw Error('Install the locked Capacitor 8.6.0 toolchain first.');
const host = resolve(root, platform);
const marker = resolve(host, '.clipt-generated-host.json');
async function exists(path) { try { await access(path); return true; } catch { return false; } }
if (await exists(host) && !(await exists(marker))) {
  throw Error('An existing native project was found. Preserve it and integrate manually; this generator never replaces an unmarked project.');
}
if (!(await exists(resolve(root, 'dist/index.html')))) throw Error('Build the web app before preparing native hosts.');
function cap(...args) {
  const result = spawnSync(process.execPath, [resolve(root, 'node_modules/@capacitor/cli/bin/capacitor'), ...args], {
    cwd: root, env: { ...process.env, CI: 'true' }, stdio: 'inherit', timeout: 180000,
  });
  if (result.error || result.status !== 0) throw Error('Capacitor project generation/sync failed.');
}
if (!(await exists(host))) {
  cap('add', platform);
  await writeFile(marker, JSON.stringify({ generator: 'clipt-native-host-v1', capacitor: version }) + '\n');
}
cap('sync', platform);
async function transform(path, change) {
  const absolute = resolve(host, path);
  const original = await readFile(absolute, 'utf8');
  await writeFile(absolute, change(original));
}
function replaceRequired(source, search, replacement) {
  if (!source.includes(search)) throw Error('The generated native template changed; review the integration before continuing.');
  return source.replace(search, replacement);
}
if (platform === 'android') {
  await transform('settings.gradle', source => source.includes("include ':clipt-broadcaster'") ? source : source +
    "\ninclude ':clipt-broadcaster'\nproject(':clipt-broadcaster').projectDir = new File('../native/android')\n");
  await transform('build.gradle', source => {
    if (!source.includes('kotlin-gradle-plugin:2.2.21')) source = replaceRequired(source,
      "classpath 'com.android.tools.build:gradle:8.13.0'",
      "classpath 'com.android.tools.build:gradle:8.13.0'\n        classpath 'org.jetbrains.kotlin:kotlin-gradle-plugin:2.2.21'");
    if (!source.includes('https://jitpack.io')) source = replaceRequired(source,
      'allprojects {\n    repositories {', "allprojects {\n    repositories {\n        maven { url 'https://jitpack.io'; content { includeGroup 'com.github.pedroSG94.RootEncoder' } }");
    return source;
  });
  await transform('variables.gradle', source => source.replace('minSdkVersion = 24', 'minSdkVersion = 26'));
  await transform('app/build.gradle', source => {
    if (!source.includes("implementation project(':clipt-broadcaster')")) source = replaceRequired(source, 'dependencies {', "dependencies {\n    implementation project(':clipt-broadcaster')");
    source = source.replace('minifyEnabled false', 'minifyEnabled true').replace("getDefaultProguardFile('proguard-android.txt')", "getDefaultProguardFile('proguard-android-optimize.txt')");
    if (!source.includes('cliptDevelopmentSigning')) source = replaceRequired(source, 'release {', "release {\n            if (project.findProperty('cliptDevelopmentSigning') == 'true') signingConfig signingConfigs.debug");
    return source;
  });
  const config = JSON.parse(await readFile(resolve(host, 'app/src/main/assets/capacitor.config.json'), 'utf8'));
  const packageName = config.appId;
  if (!/^[a-zA-Z][\w]*(\.[a-zA-Z][\w]*)+$/.test(packageName)) throw Error('Invalid native application ID.');
  const java = resolve(host, 'app/src/main/java', packageName.replaceAll('.', '/'), 'MainActivity.java');
  await writeFile(java, `package ${packageName};
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.clipt.broadcast.CliptBroadcasterPlugin;
public class MainActivity extends BridgeActivity {
  @Override public void onCreate(Bundle state) {
    registerPlugin(CliptBroadcasterPlugin.class);
    super.onCreate(state);
  }
}
`);
  await transform('app/src/main/AndroidManifest.xml', source => source.replace('android:allowBackup="true"', 'android:allowBackup="false"'));
} else {
  const require = createRequire(cliPackage);
  const plist = require('plist');
  const xcode = require('xcode');
  const infoPath = resolve(host, 'App/App/Info.plist');
  const info = plist.parse(await readFile(infoPath, 'utf8'));
  info.NSCameraUsageDescription = 'Use your camera when you choose Camera Live.';
  info.NSMicrophoneUsageDescription = 'Include your microphone when you choose audio for a live broadcast.';
  info.UIBackgroundModes = ['audio', 'screen-capture'];
  info.CLIPTNativeBroadcastEnabled = process.env.CLIPT_NATIVE_BACKEND_READY === 'true';
  info.UIApplicationSceneManifest.UIApplicationSupportsMultipleScenes = false;
  await writeFile(infoPath, plist.build(info));
  await transform('App/App/SceneDelegate.swift', source => source.replace('CAPBridgeViewController()', 'CliptBridgeViewController()'));
  const controller = 'CliptBridgeViewController.swift';
  await writeFile(resolve(host, 'App/App', controller), `import Capacitor
import CliptBroadcaster
final class CliptBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(CliptBroadcasterPlugin())
    }
}
`);
  const projectPath = resolve(host, 'App/App.xcodeproj/project.pbxproj');
  const project = xcode.project(projectPath);
  project.parseSync();
  const group = project.findPBXGroupKey({ path: 'App' });
  if (!group) throw Error('App group was not found.');
  if (!project.hasFile(controller)) project.addSourceFile(controller, { target: project.getFirstTarget().uuid }, group);
  await writeFile(projectPath, project.writeSync());
  // cap sync manages this file. Restore our reviewed exact/local dependencies
  // after every sync; one resolver identity is shared by host and plugin.
  await writeFile(resolve(host, 'App/CapApp-SPM/Package.swift'), `// swift-tools-version: 6.0
import PackageDescription
let package = Package(
    name: "CapApp-SPM",
    platforms: [.iOS(.v15)],
    products: [.library(name: "CapApp-SPM", targets: ["CapApp-SPM"])],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.6.0"),
        .package(path: "../../../native/ios")
    ],
    targets: [.target(name: "CapApp-SPM", dependencies: [
        .product(name: "Capacitor", package: "capacitor-swift-pm"),
        .product(name: "Cordova", package: "capacitor-swift-pm"),
        .product(name: "CliptBroadcaster", package: "ios")
    ])]
)
`);
}
console.log('Prepared ' + platform + ' host. Native compilation and physical tests are separate checks.');
