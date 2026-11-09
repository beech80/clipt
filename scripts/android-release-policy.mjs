import { releaseVersion } from './ios-release-policy.mjs';

export function androidStoreGradle(source, version) {
  releaseVersion(version.version, version.build);
  if (source.includes('cliptDevelopmentSigning') || /signingConfig\s+signingConfigs\.debug/.test(source))
    throw Error('Generate a fresh store host; development signing must never enter the store profile.');
  source = source.replace(/versionCode\s+\d+/, 'versionCode ' + Number(version.build))
    .replace(/versionName\s+"[^"]*"/, 'versionName "' + version.version + '"')
    .replace('minifyEnabled false', 'minifyEnabled true')
    .replace("getDefaultProguardFile('proguard-android.txt')", "getDefaultProguardFile('proguard-android-optimize.txt')");
  if (!source.includes('versionCode ' + Number(version.build)) || !source.includes('minifyEnabled true'))
    throw Error('Android release template needs review.');
  return source;
}

export function verifyAndroidStoreManifest(xml) {
  const required = [
    /package="com\.slnjliheyiiummxhrgmk\.clip"/,
    /android:minSdkVersion="26"/,
    /android:targetSdkVersion="36"/,
    /android:allowBackup="false"/,
    /android:scheme="com\.slnjliheyiiummxhrgmk\.clip"/,
    /android:host="auth"/,
  ];
  if (required.some(rule => !rule.test(xml))) throw Error('Store identity, SDK, backup or auth callback is missing.');
  if (/android:debuggable="true"|android:usesCleartextTraffic="true"|com\.clipt\.broadcast|FOREGROUND_SERVICE|MEDIA_PROJECTION|READ_EXTERNAL_STORAGE|WRITE_EXTERNAL_STORAGE|MANAGE_EXTERNAL_STORAGE|READ_MEDIA_(IMAGES|VIDEO|AUDIO)/.test(xml))
    throw Error('Experimental broadcasting, debugging, cleartext or broad media permissions entered the store app.');
}
