import test from 'node:test';
import assert from 'node:assert/strict';
import {iosOwnerTestPlan} from '../../scripts/ios-owner-test.mjs';
const input={teamId:'ABCDE12345',deviceId:'00008110-001234567890001E',sdkVersion:'27.1'};
test('iPhone owner build uses the device SDK and exact destination with no store upload',()=>{
 const p=iosOwnerTestPlan(input);
 assert.equal(p.build.command,'xcodebuild');assert.ok(p.build.args.includes('iphoneos'));assert.ok(p.build.args.includes('id='+input.deviceId));
 assert.ok(p.build.args.includes('DEVELOPMENT_TEAM='+input.teamId));assert.equal(p.install,null);
 assert.equal(p.environment.CLIPT_IOS27_SDK,'1');assert.equal(p.environment.CLIPT_NATIVE_BACKEND_READY,'true');
 assert.ok(!p.build.args.some(a=>/exportArchive|upload|app-store|apiKey|authenticationKey/.test(a)));
});
test('installation is a separate explicit operation for the same paired iPhone',()=>{
 const p=iosOwnerTestPlan({...input,install:true});
 assert.equal(p.install.command,'xcrun');
 assert.deepEqual(p.install.args.slice(0,6),['devicectl','device','install','app','--device',input.deviceId]);
 assert.match(p.install.args[6],/Debug-iphoneos\/App\.app$/);
});
test('older or malformed SDKs cannot build the iOS27 screen path',()=>{
 for(const sdkVersion of ['26.9','27','27.1\n','unknown',undefined])assert.throws(()=>iosOwnerTestPlan({...input,sdkVersion}));
 assert.ok(iosOwnerTestPlan({...input,sdkVersion:'28.0'}));
});
test('team and device identifiers cannot add command-line options or shell code',()=>{
 for(const teamId of ['bad','ABCDE12345;echo bad','-allowProvisioningUpdates'])assert.throws(()=>iosOwnerTestPlan({...input,teamId}));
 for(const deviceId of ['../other','id=anything','00008110-001234567890001E;echo bad','00008110-001234567890001E\n'])assert.throws(()=>iosOwnerTestPlan({...input,deviceId}));
 assert.throws(()=>iosOwnerTestPlan({...input,install:'true'}));
});
