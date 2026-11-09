export const APP_ID = 'com.slnjliheyiiummxhrgmk.clip';
export const CALLBACK_SCHEME = APP_ID;
export const PRODUCTION_ORIGIN = 'https://slnjliheyiiummxhrgmk.supabase.co';

export function releaseVersion(version = '1.0.0', build = '1') {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)
      || !/^[1-9]\d{0,3}$/.test(build)) throw Error('Use a three-part app version and a build number from 1 to 9999.');
  return { version, build };
}

export function storePublicEnvironment(value) {
  if (!value || Object.keys(value).sort().join(',') !== 'supabaseAnonKey,supabaseUrl'
      || value.supabaseUrl !== PRODUCTION_ORIGIN
      || typeof value.supabaseAnonKey !== 'string'
      || value.supabaseAnonKey.trim() !== value.supabaseAnonKey) {
    throw Error('Use only the reviewed production URL and publishable client key.');
  }
  if (!/^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(value.supabaseAnonKey)) {
    let claims;
    try { claims = JSON.parse(Buffer.from(value.supabaseAnonKey.split('.')[1], 'base64url').toString()); } catch { /* Reject below. */ }
    if (claims?.role !== 'anon' || claims?.ref !== 'slnjliheyiiummxhrgmk')
      throw Error('Only the production anon client key or a publishable key can enter the app.');
  }
  return { VITE_APP_ENV: 'production', VITE_SUPABASE_URL: value.supabaseUrl,
    VITE_SUPABASE_ANON_KEY: value.supabaseAnonKey, VITE_NATIVE_RELEASE: 'app-store' };
}

export function storeInfoPlist(info, version) {
  const result = { ...info,
    CFBundleShortVersionString: version.version, CFBundleVersion: version.build,
    CFBundleURLTypes: [{ CFBundleTypeRole: 'Editor', CFBundleURLName: APP_ID,
      CFBundleURLSchemes: [CALLBACK_SCHEME] }],
    NSCameraUsageDescription: 'Take a photo or video when you choose to create a CLIPT post.',
    NSMicrophoneUsageDescription: 'Record audio when you choose to capture a video for your post.',
    NSPhotoLibraryUsageDescription: 'Choose the photos and videos you want to share in CLIPT.',
    ITSAppUsesNonExemptEncryption: false, CLIPTNativeBroadcastEnabled: false,
    CLIPTReleaseProfile: 'app-store',
    'UISupportedInterfaceOrientations~ipad': ['UIInterfaceOrientationPortrait',
      'UIInterfaceOrientationPortraitUpsideDown', 'UIInterfaceOrientationLandscapeLeft', 'UIInterfaceOrientationLandscapeRight'],
  };
  delete result.UIBackgroundModes;
  delete result.NSScreenCaptureUsageDescription;
  return result;
}

// The app's Swift wrapper itself uses no required-reason APIs. Capacitor supplies
// its own SDK manifest. Web storage inside WKWebView is not native UserDefaults.
// Collection reflects account-linked backend operations, even with analytics off.
export function storePrivacyManifest() {
  const types = ['Name', 'EmailAddress', 'UserID', 'PhotosorVideos', 'AudioData',
    'EmailsOrTextMessages', 'OtherUserContent', 'ProductInteraction'];
  return { NSPrivacyTracking: false, NSPrivacyTrackingDomains: [], NSPrivacyAccessedAPITypes: [],
    NSPrivacyCollectedDataTypes: types.map(type => ({
      NSPrivacyCollectedDataType: `NSPrivacyCollectedDataType${type}`,
      NSPrivacyCollectedDataTypeLinked: true, NSPrivacyCollectedDataTypeTracking: false,
      NSPrivacyCollectedDataTypePurposes: type === 'ProductInteraction'
        ? ['NSPrivacyCollectedDataTypePurposeAppFunctionality', 'NSPrivacyCollectedDataTypePurposeAnalytics']
        : ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
    })),
  };
}
