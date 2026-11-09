import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { verifyAndroidStoreManifest } from './android-release-policy.mjs';

const apk=resolve('android/app/build/outputs/apk/release/app-release-unsigned.apk');
const bundle=resolve('android/app/build/outputs/bundle/release/app-release.aab');
const sdk=process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
if(!sdk)throw Error('An Android SDK is required to inspect the compiled manifest.');
function command(program,args){const result=spawnSync(program,args,{encoding:'utf8',timeout:120000,maxBuffer:16*1024*1024});if(result.error||result.status!==0)throw Error('Android inspection failed: '+program+' '+(result.stderr||'').slice(-1200));return result.stdout;}
const manifest=command(resolve(sdk,'cmdline-tools/latest/bin/apkanalyzer'),['manifest','print',apk]);
verifyAndroidStoreManifest(manifest);
const receipt=JSON.parse(await readFile('dist/clipt-native-release.json','utf8'));
if(!manifest.includes('android:versionCode="'+Number(receipt.build)+'"')||!manifest.includes('android:versionName="'+receipt.version+'"'))throw Error('The compiled Android version does not match the release receipt.');
const signature=spawnSync(resolve(sdk,'build-tools/36.0.0/apksigner'),['verify',apk],{encoding:'utf8',timeout:60000});
if(signature.error||signature.status!==1||!((signature.stdout||'')+(signature.stderr||'')).includes('DOES NOT VERIFY'))throw Error('The preparation APK must be unsigned, and its signature inspection must execute successfully.');
const artifacts=JSON.parse(command('python3',['scripts/inspect-android-store.py',apk,bundle]));
if(artifacts.some(a=>a.receipt.version!==receipt.version||a.receipt.build!==receipt.build))throw Error('Release artifacts have inconsistent versions.');
await mkdir('outputs/android-store',{recursive:true});
await writeFile('outputs/android-store/AndroidManifest.xml',manifest);
const sourceCommit=command('git',['rev-parse','HEAD']).trim();
await writeFile('outputs/android-store/BUILD-INFO.json',JSON.stringify({sourceCommit,...receipt,targetAPI:36,minimumAPI:26,artifactChecked:true,signed:false,physicalDeviceVerified:false,uploadedToGooglePlay:false,webBetaDeployed:false,ownerApprovalRequired:true,artifacts},null,2)+'\n');
console.log('Unsigned Play bundle/APK, public assets, native plugins, permissions and 16 KB native-library inventory verified. Physical-device and signed-bundle tests remain required.');
