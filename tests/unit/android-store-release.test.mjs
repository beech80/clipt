import test from 'node:test';
import assert from 'node:assert/strict';
import { androidStoreGradle, verifyAndroidStoreManifest } from '../../scripts/android-release-policy.mjs';

const manifest = '<manifest package="com.slnjliheyiiummxhrgmk.clip"><uses-sdk android:minSdkVersion="26" android:targetSdkVersion="36"/><application android:allowBackup="false"><data android:scheme="com.slnjliheyiiummxhrgmk.clip" android:host="auth"/></application></manifest>';
test('store manifests reject obsolete SDKs, foreign identity and privileged experimental permissions',()=>{
  assert.doesNotThrow(()=>verifyAndroidStoreManifest(manifest));
  for(const invalid of [manifest.replace('targetSdkVersion="36"','targetSdkVersion="35"'),manifest.replace('com.slnjliheyiiummxhrgmk.clip','com.other.app'),manifest.replace('allowBackup="false"','allowBackup="true"'),manifest.replace('host="auth"','host="other"')])
    assert.throws(()=>verifyAndroidStoreManifest(invalid));
  for(const permission of ['FOREGROUND_SERVICE','MEDIA_PROJECTION','READ_EXTERNAL_STORAGE','WRITE_EXTERNAL_STORAGE','MANAGE_EXTERNAL_STORAGE','READ_MEDIA_IMAGES','READ_MEDIA_VIDEO','READ_MEDIA_AUDIO'])
    assert.throws(()=>verifyAndroidStoreManifest(manifest+'<uses-permission android:name="android.permission.'+permission+'"/>'));
  for(const unsafe of ['android:debuggable="true"','android:usesCleartextTraffic="true"','com.clipt.broadcast'])
    assert.throws(()=>verifyAndroidStoreManifest(manifest+unsafe));
});
test('store Gradle versions are validated and a development signing configuration is refused',()=>{
  const source='versionCode 1\nversionName "1.0"\nminifyEnabled false';
  const result=androidStoreGradle(source,{version:'1.0.0',build:'7'});
  assert.match(result,/versionCode 7/);assert.match(result,/versionName "1.0.0"/);assert.match(result,/minifyEnabled true/);
  assert.throws(()=>androidStoreGradle(source+'\nsigningConfig signingConfigs.debug',{version:'1.0.0',build:'7'}));
  assert.throws(()=>androidStoreGradle(source,{version:'bad',build:'7'}));
});
