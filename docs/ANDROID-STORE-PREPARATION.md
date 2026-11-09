# CLIPT Android / Google Play preparation

This is a separate **unsigned** Google Play candidate. It reuses the current CLIPT interface and production backend and does not publish or change the live web beta. A successful build is not Play approval or physical-device verification. Native phone broadcasting and paid memberships remain unavailable in the first store release; existing web/OBS and experimental development builds are preserved.

## Prepared release path

- Bundle ID/application ID: `com.slnjliheyiiummxhrgmk.clip`, preserved across platforms. Android 8/API 26 minimum; target/compile Android 16/API 36, matching Google's currently documented new-app target requirement.
- Bundled assets and the same reviewed public client configuration as iOS. No remote builder URL, service-role/server key or private provider credential is included. Backend RLS and authenticated authorization remain authoritative.
- The `play-store` host excludes the experimental CliptBroadcaster dependency, screen-capture foreground services and broad storage/media permissions. Camera/microphone permissions support user-initiated post recording; selected media uses the platform picker. Hardware features are optional.
- The common internal `VITE_NATIVE_RELEASE=app-store` flag means **native store release** on both Android and iOS. It keeps payment/broadcast UI gated and optional analytics helpers off. The packaged receipt separately identifies Android as `play-store`.
- Native App and Share plugins provide PKCE confirmation/recovery callbacks, lifecycle handling and sharing. Web sign-in URLs, current accounts and shared public post links are preserved.
- Original CLIPT branding, black launch surface, no WebView overscroll, and responsive phone/tablet layouts are retained. No fixed orientation lock is introduced.
- The pipeline builds a Release AAB and APK **without signing**. A separate temporary Debug APK is used only for emulator install/launch checks; its local UI probe is absent from Release source/binaries.
- Artifact inspection checks compiled identity/version/API/permissions, native plugins, bundled feature flags and native-library inventory. Unexpected native ELF libraries fail the build for a 16 KB alignment review. Java/Kotlin-only dependencies do not require ELF alignment, but actual 16 KB-device acceptance is still recommended.

## Reproduce on a development computer

Use a fresh checkout to avoid converting/replacing an existing broadcasting host. Requirements: Node 22.12+, Java 21, Android Studio/SDK API 36 and Build Tools 36.0.0. The repository's Gradle wrapper and locked Capacitor 8.6.0 are used.

```sh
npm ci --ignore-scripts --no-fund --no-audit
npm run typecheck
npm test
CLIPT_APP_VERSION=1.0.0 CLIPT_BUILD_NUMBER=1 node scripts/build-android-store.mjs
npx playwright install chromium
node scripts/generate-native-brand-assets.mjs
CLIPT_NATIVE_PROFILE=play-store CLIPT_APP_VERSION=1.0.0 CLIPT_BUILD_NUMBER=1 node scripts/prepare-native-hosts.mjs android
cd android
chmod +x gradlew
./gradlew :app:bundleRelease :app:assembleRelease :app:assembleDebug --no-daemon
```

These environment-variable examples use a Mac/Linux shell; Android Studio can build the prepared project on Windows as well. The prepared Android Studio ZIP includes the relative local Capacitor/App/Share dependencies, excluding build caches, local SDK paths and keystores. Verify `SHA256SUMS.txt`, inspect `BUILD-INFO.json`, unzip, and open its `android` directory in Android Studio. Set your local SDK path through Android Studio. Use a new increasing versionCode for every Play upload. Do not run the experimental broadcasting helper or plain `cap sync` over this reviewed package.

## Owner actions before distribution

1. Create/verify the correct personal or organization Google Play Console account through Google's official enrollment flow. Complete identity/organization verification and any testing requirements shown for that account. Do not send account passwords or keys in chat.
2. Add the same two exact additional Supabase Redirect URLs used by iOS, preserving the current Site URL and web redirects:
   - `com.slnjliheyiiummxhrgmk.clip://auth/confirm`
   - `com.slnjliheyiiummxhrgmk.clip://auth/recovery`
   Request/open each PKCE email link on the same device/app installation. This dashboard configuration has not been changed by the build.
3. In Android Studio choose Build → Generate Signed App Bundle/APK → Android App Bundle. Create/choose a private **upload key** on your own computer and retain a secure backup. Do not commit or share it. Review Play App Signing in Play Console. The provided unsigned AAB cannot be uploaded as a completed release.
4. Install a signed internal-testing build through Google Play on the real Android phone and tablet if supported. Complete the physical checklist below. A Debug emulator launch is not signed-in or signed-Release verification.
5. Supply actual screenshots, store listing, IARC rating, content rights, Data safety answers, a working private reviewer account and app-access instructions. No manual invite approval should block reviewers. Never bypass backend permissions/MFA to provide review access.
6. Publish the tested public-support change with approval before using `https://clipttest-matthew-beechers-projects.vercel.app/docs/user-guide` as the listing's support URL. Production Privacy (`/privacy`), Terms (`/terms`) and account deletion (`/delete-account`) use existing pages. Verify all listing URLs without an account before submission. Keep `beecher@cliptgaming.com` as the support contact.
7. Obtain explicit owner approval before uploading, opening testing distribution or submitting a production release. Nothing in the preparation workflow signs or uploads to Google Play.

## Physical acceptance — not yet verified

Record device/OS, candidate commit, versionCode and result. Use a disposable account for account-deletion tests.

- Welcome/cold launch; email/password login, confirmation and recovery with the app open/closed; expired/reused/cross-device links; MFA enrollment/challenge.
- Upload from Photos and Files, post recording camera/mic allow/deny, 100 MiB boundary, HEVC conversion, interrupted upload/retry, publish and immediate playback/audio.
- Hardware Back, rotation without losing the current clip, left/right-handed controls, tablet/foldable resizing, system bars and safe areas. Test large text, TalkBack, reduced motion and magnification.
- Comments/keyboard, messages, mentions/hashtags, profiles, Likes, follows, free Trophies/achievements, game channels and native sharing to the exact public post URL.
- Background/foreground, screen lock/unlock, offline/reconnect and battery restrictions. Ordinary video pauses on backgrounding; no unexpected camera/microphone/broadcast activity.
- Reporting/blocking, protected moderator queues and clean-photo/caption behavior. Manual video moderation still needs an operator.
- Account deletion from Settings and outside-app deletion help; backend cleanup and sign-in revocation complete, with honest failure/retry handling.
- Verify that this release cannot start paid checkout or native camera/screen broadcasts. No native push notifications are introduced by this package.
- Inspect the signed AAB in Play's pre-launch report and test a 16 KB environment when available; review any later SDK/native-library change before release.

## Data safety and listing worksheet

Owner verification remains required: account-linked names, email/user IDs, photos/videos/audio, captions/comments/profile text, messages, reports and interactions processed for app functionality and internal analytics. Disclose actual Supabase/media/moderation processors and retention/security logs. Optional analytics helper calls are off in store builds; backend view/social counters still process data. Do not declare “no data collected.” No ads identifier, cross-app advertising, location, contacts import or native push registration is added here.

Account deletion, reporting and blocking reuse current application/backend flows. Their availability in source and automated fixtures is not proof of real signed-device end-to-end acceptance. Native livestream broadcasting, Google Play Billing, automatic video moderation and custom-domain migration remain separate work.

Sources checked 2026-11-09: [Google Play target API](https://developer.android.com/google/play/requirements/target-sdk), [16 KB support](https://developer.android.com/guide/practices/page-sizes), [Android signing](https://developer.android.com/studio/publish/app-signing), [Data safety](https://support.google.com/googleplay/android-developer/answer/10787469), [account deletion](https://support.google.com/googleplay/android-developer/answer/13327111).
