# CLIPT iPhone/iPad release preparation

This is an isolated native release candidate. It does **not** deploy or modify the live web beta, create an Apple listing, sign an app, or submit anything to Apple. A passing archive is not App Store approval. Native camera/screen broadcasting and paid memberships are deliberately unavailable in this release; the existing web and OBS paths are preserved.

## Implemented release path

- Existing React UI, original controller, accessibility, social interactions and backend are reused as bundled Capacitor 8.6.0 assets. No live remote builder URL is loaded into the native bridge.
- The separate store profile uses the production **public anon/publishable** client configuration in `native/store-client.json`. This is the same category of public client key delivered to web browsers; it is not a server/service-role secret. RLS and authenticated backend authorization remain mandatory.
- Native authentication uses PKCE and exact custom-scheme callbacks, with cold/warm URL handling and duplicate-delivery protection. Password sign-in remains unchanged. Web confirmation/reset redirects remain unchanged.
- Native lifecycle listeners stop token refresh and pause ordinary audio/video on backgrounding. Foregrounding resumes token refresh, not automatic audio playback. No background-broadcast entitlement is included.
- Original CLIPT icon and black launch screen, media permission descriptions, version/build numbers, standard-encryption declaration, and an app privacy manifest are generated into the Xcode host.
- Optional analytics helper calls are disabled in store builds. Backend interactions (views, posts, messages, moderation) still process data and are disclosed; this is not a “collects no data” application.
- Account deletion already exists at Settings → Data Privacy → Delete account. Reports, blocking and moderator review use existing systems. Their production readiness must be exercised with a disposable review/test account on the actual installed build.

## Build and inspect

The **CLIPT iOS App Store preparation** GitHub workflow builds an iOS simulator app and an **unsigned** device archive, checks the packaged configuration/privacy manifest, and produces `clipt-ios-app-store-preparation`. It never uploads to App Store Connect. Check that every job passed on the candidate commit; do not use artifacts from a failed run.

Requirements for local generation: Node 22.12+ (Node 24 also supported), Xcode with the iOS 26+ SDK, npm lockfile, and a Mac. Apple's currently documented submission minimum is Xcode 26/iOS 26 SDK (recheck before submission).

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run typecheck
npm test
CLIPT_APP_VERSION=1.0.0 CLIPT_BUILD_NUMBER=1 node scripts/build-ios-store.mjs
npx playwright install chromium
node scripts/generate-native-brand-assets.mjs
CLIPT_NATIVE_PROFILE=app-store CLIPT_APP_VERSION=1.0.0 CLIPT_BUILD_NUMBER=1 node scripts/prepare-native-hosts.mjs ios
node scripts/verify-ios-store.mjs
open ios/App/App.xcodeproj
```

Choose a new build number for every App Store Connect upload. Never run the broadcasting owner-test helper against this store profile; it intentionally prepares a different, experimental development build. Re-running `cap sync` on its own overwrites the reviewed Swift package integration; use `prepare-native-hosts.mjs` to restore it.

The prepared ZIP retains the relative layout of `ios/App` and `node_modules/@capacitor/app`, so Xcode can resolve the local App plugin. It contains no private signing material. Verify `SHA256SUMS.txt` and `BUILD-INFO.json`, then unzip on the Mac. Open the project, not the unsigned archive, for the signing build.

## Owner setup before TestFlight

1. Enroll in/confirm an active Apple Developer Program membership. Use your real individual or legal business identity. Do not send Apple passwords, certificates, private keys or recovery codes in chat.
2. In Xcode → Settings → Accounts, sign into your Apple developer account. In App → Signing & Capabilities, select your Team and Automatic Signing. Keep bundle ID `com.slnjliheyiiummxhrgmk.clip` if it is available to your team. If unavailable, update the app ID, callbacks, tests and release checks together before signing; never change just the Xcode field.
3. Add these **two exact additional Redirect URLs** in production Supabase Auth → URL Configuration, preserving the current Site URL and every web redirect:
   - `com.slnjliheyiiummxhrgmk.clip://auth/confirm`
   - `com.slnjliheyiiummxhrgmk.clip://auth/recovery`
   This dashboard change has not been applied by the preparation scripts. Native confirmation/recovery cannot pass without it. Keep `{{ .ConfirmationURL }}` in the email templates; do not replace it with the callback itself. Request and open each PKCE email link on the same device/app installation.
4. Pair the physical iPhone (and iPad if distributing to iPad), enable Developer Mode if requested, select it in Xcode, and Run. Complete the acceptance checklist below. Do not use the simulator as a substitute for media/permissions testing.
5. Create the CLIPT iOS app record in App Store Connect with the exact bundle ID and a unique SKU you choose. Verify seller identity, agreements, content rights and availability. Do not enable paid features or native broadcasting as part of this process.
6. Product → Archive → Distribute App → App Store Connect → TestFlight. This step uploads to Apple and requires the owner's explicit release approval. Install through TestFlight, retest, and collect the required actual-device screenshots. Do not submit concept art as screenshots.

## Physical acceptance — not yet verified

Record OS/device, candidate commit, build number, result and any issue. Test a new account and an existing account, with a disposable account for deletion.

- Cold launch/welcome, login, logout, email verification, reset password with closed and open app, expired/reused links and cross-device failure messages.
- MFA enrollment/challenge/recovery handling; existing moderator protection remains enforced.
- Upload photo/video from Photos and Files (including the 100 MiB video boundary), camera permission deny/allow, interrupted upload, publish, immediate feed playback, audio/mute, HEVC conversion behavior, background/foreground and lock/unlock.
- Portrait/landscape on small and large displays, text scaling, VoiceOver, reduced motion, keyboard with comments/messages, safe areas and controller placement. Keep the current feed/video sizing unchanged.
- Like, comments/replies, mentions/hashtags, creator profiles, follows, Trophies/achievements, game channels, search, messages, link sharing and notifications.
- Report and block abusive content/accounts; owner moderator can view protected review queues. Photo/caption automatic scanning and manual video moderation must have a responsible operator.
- Delete disposable account inside the installed app; verify sign-in is revoked, data/media cleanup completes and no misleading completion is shown. Exercise failure/retry, not the owner's real account.
- Network offline/reconnect/slow network; no video restarts on orientation changes beyond current platform behavior. No unexpected camera, microphone or background streaming.
- Confirm membership/payment UI cannot open checkout in this iOS release, and broadcasting does not request permissions or create Mux resources.

## App Store Connect content draft

Name: **CLIPT**

Subtitle: **Gaming clips and community**

Description draft: **Share gaming moments, discover Clipt channels for your favorite games, and connect with other players. Watch clips, join the conversation, follow creators, and celebrate standout moments with free Trophies. Customize your controller layout with accessibility and handedness preferences.**

Do not advertise phone broadcasting, paid subscriptions, universal game coverage or other unavailable features. Category candidate: Social Networking (owner to confirm). Age rating: complete Apple's current questionnaire based on actual UGC, messaging, moderation and content controls; do not guess an age rating. Verify rights for all artwork and screenshots.

Support contact: **beecher@cliptgaming.com**. Proposed existing public URLs (verify before submitting):
- Support: `https://clipttest-matthew-beechers-projects.vercel.app/docs/user-guide`
- Privacy: `https://clipttest-matthew-beechers-projects.vercel.app/privacy`
- Terms: `https://clipttest-matthew-beechers-projects.vercel.app/terms`

The custom domain remains a separate owner decision. Ensure the submitted support/privacy pages are publicly accessible in Safari without an account or invite, remain stable, and provide working contact details. Complete App Store privacy answers with actual production processors and retention. The manifest does not replace App Store Connect disclosures or legal review.

Review notes draft: **CLIPT is a gaming social-content app. The CLIPT control opens navigation; upload, comments and creator profiles use the existing controller. Account deletion is available in Settings → Data Privacy. Reporting/blocking are available on content/profile menus. This first iOS release does not enable paid purchases or camera/screen broadcasting.** Supply an owner-controlled working review/demo account and instructions through App Store Connect's private review fields, not the repository. Do not require reviewers to wait for manual approval. Ensure review access is compatible with the real account-verification/MFA rules; never bypass RLS.

## Privacy worksheet — owner verification required

Account-linked data for app functionality: name/display name, email, user ID, photos/videos and user-provided audio, captions/comments/profile text, messages and reports. Product interactions (views, likes, follows and related counters) also support internal analytics. User-submitted media/captions may be sent to the configured moderation processor. Server/CDN/security logs and retention must be checked with the actual Supabase, media, moderation and monitoring settings before final disclosure. No advertising identifier, cross-app advertising tracking, location, contacts import or native push registration is introduced by this change.

The wrapper itself uses no required-reason native API; Capacitor's SDK manifest is included through SwiftPM. Generate Xcode's combined Privacy Report from the signed archive and inspect every SDK. Optional web analytics helper calls are gated off in native store builds. If later adding native Preferences, Filesystem, push, analytics, ads, IAP or broadcasting plugins, update disclosures and required-reason declarations from actual API use. Do not add invented reason codes to silence warnings.

## Remaining release gates

Not complete until verified: Apple membership/team, native redirect allowlist, successful current CI archive, owner signing, physical-device acceptance, TestFlight acceptance, actual screenshots, privacy/age-rating/content-rights confirmation, review account, Apple agreements and explicit submission approval. Custom domain migration, native livestream broadcasting, native IAP and automatic video moderation are separate work and are not claimed ready by this package.

References checked 2026-11-07: [Apple submission SDK minimum](https://developer.apple.com/news/upcoming-requirements/?id=04282026a), [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), [Account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app/), [Capacitor deep links](https://capacitorjs.com/docs/guides/deep-links), [Privacy manifest](https://capacitorjs.com/docs/ios/privacy-manifest), [Supabase PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow).
