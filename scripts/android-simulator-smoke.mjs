import {spawnSync} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {APP_ID} from './ios-release-policy.mjs';
const adb=process.env.ANDROID_HOME?resolve(process.env.ANDROID_HOME,'platform-tools/adb'):'adb';
function run(args,timeout=30000){const r=spawnSync(adb,args,{encoding:'utf8',timeout,maxBuffer:8*1024*1024});if(r.error||r.status!==0)throw Error('ADB '+args[0]+' failed: '+(r.stderr||'').slice(-700));return r.stdout.trim();}
run(['wait-for-device'],180000);
let booted=false;
for(let n=0;n<90;n++){try{if(run(['shell','getprop','sys.boot_completed'])==='1'){booted=true;break;}}catch{}await new Promise(done=>setTimeout(done,2000));}
if(!booted)throw Error('Android emulator did not finish booting.');
run(['shell','input','keyevent','82']);
run(['install','--no-incremental','-r',resolve('android/app/build/outputs/apk/debug/app-debug.apk')],120000);
run(['shell','am','start','-W','-n',APP_ID+'/.MainActivity'],60000);
const receipt=JSON.parse(await readFile('dist/clipt-native-release.json','utf8'));
let ui;
for(let n=0;n<45;n++){try{ui=JSON.parse(run(['shell','run-as',APP_ID,'cat','cache/CLIPT-native-smoke.json']));if(ui.bridgeReady&&ui.welcomeVisible)break;}catch{}await new Promise(done=>setTimeout(done,2000));}
const stayedRunning=Boolean(run(['shell','pidof',APP_ID]));
await mkdir('outputs/android-store',{recursive:true});
const shot=spawnSync(adb,['exec-out','screencap','-p'],{timeout:30000,maxBuffer:12*1024*1024});
if(shot.error||shot.status!==0)throw Error('Android screenshot failed.');
await writeFile('outputs/android-store/emulator-welcome.png',shot.stdout);
const info={api:run(['shell','getprop','ro.build.version.sdk']),appId:APP_ID,installed:true,launched:true,stayedRunning,nativeBridgeReady:ui?.bridgeReady===true,welcomeRendered:ui?.welcomeVisible===true,buildMatches:ui?.build===receipt.build,physicalDeviceVerified:false,authenticatedFlowsVerified:false};
await writeFile('outputs/android-store/EMULATOR-INFO.json',JSON.stringify(info,null,2)+'\n');
if(info.api!=='36'||!info.nativeBridgeReady||!info.welcomeRendered||!info.buildMatches||!stayedRunning)throw Error('Android native bridge and welcome UI did not pass. Inspect the screenshot and EMULATOR-INFO.json.');
console.log('Installed and launched the store-profile Debug app on Android API 36; native App bridge and welcome UI passed. Release artifacts remain unsigned.');
