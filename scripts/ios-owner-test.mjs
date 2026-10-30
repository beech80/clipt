import {spawnSync} from 'node:child_process';
import {access} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
export function iosOwnerTestPlan({teamId,deviceId,sdkVersion,install=false}){
 if(typeof teamId!=='string'||! /^[A-Z0-9]{10}$/.test(teamId))throw Error('Use your10-character Apple development Team ID.');
 if(typeof deviceId!=='string'||! /^[A-Fa-f0-9-]{20,60}$/.test(deviceId))throw Error('Use the identifier of your paired development iPhone.');
 if(typeof sdkVersion!=='string'||! /^\d+\.\d+(?:\.\d+)?$/.test(sdkVersion)||Number(sdkVersion.split('.')[0])<27)
  throw Error('Use Xcode with the actual iPhoneOS27 or later SDK for Screen Live.');
 if(typeof install!=='boolean')throw Error('Choose installation explicitly with --install.');
 const output='outputs/native-ios-owner';
 return{
  environment:{CLIPT_IOS27_SDK:'1',CLIPT_NATIVE_BACKEND_READY:'true'},
  build:{command:'xcodebuild',args:['-project','ios/App/App.xcodeproj','-scheme','App','-sdk','iphoneos','-configuration','Debug',
   '-destination','id='+deviceId,'-derivedDataPath',output,'-allowProvisioningUpdates','DEVELOPMENT_TEAM='+teamId,'CODE_SIGN_STYLE=Automatic','build']},
  install:install?{command:'xcrun',args:['devicectl','device','install','app','--device',deviceId,output+'/Build/Products/Debug-iphoneos/App.app']}:null,
 };
}
function execute(command,args,options={}){
 const result=spawnSync(command,args,{shell:false,timeout:1800000,...options});
 if(result.error||result.status!==0)throw Error('The Apple development build/install failed. Check the local Xcode message; do not share signing credentials.');
 return result;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.platform!=='darwin')throw Error('Run the prepared iPhone project on your Mac with Xcode.');
 const [teamId,deviceId,flag,...extra]=process.argv.slice(2);
 if(extra.length||flag!==undefined&&flag!=='--install')throw Error('Usage: node scripts/ios-owner-test.mjs TEAM_ID DEVICE_ID [--install]');
 const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
 await access(resolve(root,'ios/App/App.xcodeproj'));
 const sdk=execute('xcrun',['--sdk','iphoneos','--show-sdk-version'],{encoding:'utf8',timeout:30000}).stdout.trim();
 const plan=iosOwnerTestPlan({teamId,deviceId,sdkVersion:sdk,install:flag==='--install'});
 const options={cwd:root,env:{...process.env,...plan.environment},stdio:'inherit'};
 execute(plan.build.command,plan.build.args,options);
 if(plan.install)execute(plan.install.command,plan.install.args,{...options,timeout:120000});
 console.log(plan.install?'Installed the development build on the selected paired phone. Physical streaming verification is still required.':'Development signing/build finished. No app-store upload or hosted configuration change was performed.');
}
