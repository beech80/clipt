# Native phone broadcasting implementation — October 30, 2026

This records implemented source and observed verification. Native broadcasting is not certified for launch: private setup and physical-device acceptance remain incomplete.

## Configuration update — October31,2026

- The owner replaced the wrong access-token credential with a signing pair in development. The read-only playback probe now reaches AUTHENTICATION_REQUIRED rather than PLAYBACK_UNAVAILABLE: the private RSA key imports successfully. Matching the signing ID/Mux environment is still an authenticated playback acceptance check.
- The owner reports the native webhook and MUX_NATIVE_WEBHOOK_SECRET are saved. Real signed webhook delivery still needs verification.
- Grant redemption still returns NATIVE_DISABLED. No publishing activation or paid resource was performed.
- The confirmed development owner is still beecher@cliptgaming.com. SQL inspection found0 native sessions and a successful expiry run at10:24AM Chicago time.
- Recent native cleanup schedule runs were skipped. The scoped worker token and schedule activation remain pending.
- extensions.gen_random_bytes(integer) exists in development. The owner can generate a private64-character token in the signed-in SQL editor with `select pg_catalog.encode(extensions.gen_random_bytes(32), 'hex') as cleanup_token;`, then copy the same value directly into Supabase/GitHub Secrets. Do not return this generated value through chat or commit it.

## Implemented

- Exact Capacitor8.6.0 runtime and reproducible hosts loading the reviewed bundled app. Existing CLIPT interface, controller artwork, OBS, navigation and web deployment are preserved.
- Android Camera2/MediaCodec H.264/AAC publishing and MediaProjection Screen Live with a foreground service, explicit native Stop, conditional game/microphone audio, camera preview/switch/mute/end, expiry, heartbeats, permission revocation and bounded network reconnect.
- Pinned RootEncoder2.8.1, explicit RTMPS hostname verification, and stripped third-party logging in the minified nondebug app. No stream key is placed in Intent extras or saved permission bundles.
- iOS AVFoundation/VideoToolbox camera publishing and the iOS27 ScreenCaptureKit system-picker path. Capture uses the iPhone-supported lifecycle: source changes stop/recreate SCStream, queued changes accept only the latest consent, replaced-stream callbacks cannot terminate a new capture, and source-picker dismissal preserves an existing stream.
- iOS game audio drives the mixer when the system picker disables microphone capture. Independent microphone/game mute choices and existing audio format are retained. Camera audio retains its microphone clock.
- Pinned HaishinKit2.2.5 revision dc880cb540b8feeb98f64e8b7dcfaaf320b6b2bd and bundled licenses. SDK/OS/hardware encoder checks determine native capabilities.
- Native Camera Live / Screen Live controls,360p/15FPS default and higher advertised presets, audio/orientation controls, owner-session recovery, background screen ownership, and account-change/sign-out capture stops. The browser does not impersonate a native screen broadcaster.
- Authenticated session creation/current/status/stop/playback, fresh Auth session/MFA/invitation/owner checks, one publisher per owner, creation limits, atomic hashed one-use grants, fixed expiry, provider-verified LIVE state, private signed playback, signed webhook validation and scoped reconciliation.
- Key parsing accepts raw/base64 PEM, copied whitespace and escaped PEM line breaks. It retains RSA import,2048-bit minimum,16384-character limit, nonextractable keys and redacted errors; API-token secrets/public keys/weak keys remain rejected.

The normal client flow delivers transport credentials to the native broker. This is client separation, not device attestation. Mux API/signing credentials remain server-side. Private playback tokens have bounded validity; instantaneous revocation of an already issued token is not claimed.

## Source references

| Change | PR | Main commit |
| --- | --- | --- |
| Native publishing engines and secure sessions | [30](https://github.com/beech80/clipt/pull/30) | 59fb05fb90c0db17b61867e30f5db63e7d5e8f79 |
| Android development owner package | [31](https://github.com/beech80/clipt/pull/31) | 04313eace7125ac9ac8735385871c88ad75973ab |
| iPhone device compatibility, audio routing and owner project | [32](https://github.com/beech80/clipt/pull/32) | fd237be20027b840183d17c74da0753946406a4d |
| Copied signing-key normalization | [33](https://github.com/beech80/clipt/pull/33) | 72afaea081a3361d60a03a83f2d399b2705f5028 |

The branches retain feature-native-mobile-broadcasting-20261030, feature-native-owner-test-package-20261030, feature-ios-owner-device-package-20261030 and fix-native-signing-key-normalization-20261030. The test runs below identify the exact source heads; merged/documentation commits have different identifiers.

## Automated evidence

- [Latest app/source verification](https://github.com/beech80/clipt/actions/runs/41120375177), source17928324843c451449e66135ee86d5113f63e78a:811 app tests and12 monitor tests passed;0 failures; typecheck, CSS, web build, npm audit (0 vulnerabilities), Chromium and WebKit regressions passed. Signing tests verify actual JWT signatures over8 supported key-format variants and reject unsafe inputs.
- [Native verification](https://github.com/beech80/clipt/actions/runs/41111317236), source475864d36aeee85e1273256a3e1b12f559dd936b: Android compile/minified APK/native unit checks passed; iOS simulator and physical-iPhone-SDK builds passed;14 Swift tests passed with0 failures. The physical SDK check is now part of normal native CI.
- [iPhone owner device archive](https://github.com/beech80/clipt/actions/runs/41111317044), same native source: actual iPhoneOS27.1 arm64 archive passed, native identity checked, development public key accepted,8 owner/configuration boundary checks passed.
- [Android owner package](https://github.com/beech80/clipt/actions/runs/41104358378), source70afa0af6caff0229d9dfc7808899e415ff865cc:4 packaging boundary tests, development public-key acceptance, Android native tests, minified APK and APK Signature Scheme v2 verification passed. Later iPhone/backend changes do not alter that Android client's implementation.
- [Existing streaming integration checks](https://github.com/beech80/clipt/actions/runs/41094875808):48 stream unit checks and5 browser flow cases passed. Native browser cases simulate the Capacitor transport and intercept hosted requests; they do not prove capture or real RTMPS.
- Lifecycle SQL tests execute the actual native SQL for ownership, grant replay, fixed expiry, viewer invitation, signed markers, account revocation and browser-role denial.

The device SDK caught pixelFormat/updateContentFilter/updateConfiguration calls unavailable on iPhone despite the earlier simulator pass. Those calls were removed in favor of the documented iOS lifecycle and the stronger device compile now covers them. No failing behavioral assertion was removed.

## Device packages

The successful Android run provides CLIPT-development-owner-test-Android: APK, BUILD-INFO.json, README and SHA256SUMS. It targets development, not localhost. Its temporary developer signing key is for owner testing; future updates can require uninstalling that development app. A stable approved signing key is required for normal upgradeable distribution.

The successful iPhone run provides CLIPT-development-owner-test-iPhone: prepared Xcode project, unsigned arm64 archive, build metadata, instructions and checksums. It is not a signed installable IPA. On the owner's Mac, scripts/ios-owner-test.mjs validates the actual SDK/team/paired-device identifiers, preserves the SDK27 flags during package resolution/build, and installs only with --install. Apple signing/provisioning still requires the owner's account.

Artifacts expire after7 days (November6,2026). See NATIVE-ANDROID-OWNER-TEST.md and NATIVE-IOS-OWNER-TEST.md for installation/acceptance instructions. No physical screenshot or broadcast is represented by these artifacts. The original1024px CLIPT icon was inspected; its opaque PNG format was verified.

## Observed development state

Project akiksrlzdqvipqbbjxpw only:

- Private native tables/functions and RLS are installed; anon/authenticated cannot SELECT the native tables or execute the service-only RPC.
- native-broadcast-session version5 is deployed. The signing parser is the only changed file relative to the previous deployed function; all5 other dependencies were compared and preserved. Gateway verify_jwt remains false because the function performs per-action authentication for user JWTs, one-use grants, scoped cleanup and signed provider callbacks.
- Initial October30 probes after that deployment returned PLAYBACK_UNAVAILABLE for playback initialization and NATIVE_DISABLED for grant redemption. The owner confirmed using an Access Tokens → Token Secret in the signing field, then replaced it with the signing pair. The October31 update above records the successful private-key import. No credential value was retrieved or logged.
- SQL inspection found0 native sessions. The SQL-only per-minute expiry job succeeded at20:20UTC on October30. It sends no secrets through pg_net.
- Anonymous user requests and forged webhooks were previously verified as denied with private/no-store response caching.
- No native provider stream was created by these checks. Hosted publishing remains gated; no paid native stream was enabled.
- The last development advisor snapshot still included its leaked-password-protection warning. No blanket Supabase security clearance is claimed; production and development settings must not be confused.

Production project slnjliheyiiummxhrgmk, production frontend, payment gates and app stores were not deployed or enabled by this work.

## Private setup still required

Do not put credentials in chat, source, VITE variables, screenshots, artifacts or logs.

1. The development private signing key now imports successfully. Verify its MUX_SIGNING_KEY_ID belongs to the matching pair and the same Mux environment as the Video API token during authenticated playback. The earlier access-token/signing-key mismatch is resolved at the import step.
2. The owner reports the dedicated Mux webhook and endpoint-specific MUX_NATIVE_WEBHOOK_SECRET are saved in development. Keep the OBS webhook. Verify actual signed delivery; the earlier download_failed video-import attempt was not webhook evidence.
3. Create a separate high-entropy64–256-character URL-safe cleanup token. Store it as CLIPT_NATIVE_RECONCILE_TOKEN in both development Supabase Secrets and GitHub encrypted repository Secrets. Verify the cleanup workflow manually before enabling repository variable CLIPT_NATIVE_RECONCILE_ENABLED=true. Its5-minute worker supplements, rather than replaces, SQL expiry.
4. Set CLIPT_NATIVE_TEST_OWNER_ID to the confirmed development Auth owner for beecher@cliptgaming.com. Existing MUX_TOKEN_ID / MUX_TOKEN_SECRET must retain required Video permissions in the same environment.
5. Only after configuration/delivery checks, enable the bounded test gates: CLIPT_NATIVE_BROADCAST_ENABLED=true, CLIPT_NATIVE_MUX_CREATE_ENABLED=true, CLIPT_NATIVE_MUX_MODE=test, CLIPT_NATIVE_MAX_DURATION_SECONDS=300 and CLIPT_NATIVE_MUX_PAID_APPROVED=false. Paid/general production streaming is a separate approval/release decision.

## Outstanding physical acceptance

Use the configured signed native builds on the actual iPhone and Android phone and view from a second device. Verify camera image/audio, camera switching, microphone and game-audio mute, system screen consent, switching to a game, denied permissions, OS Stop, backgrounding/lock/interruption, network recovery, orientation, thermal/battery behavior, current video/chat/profile/game-channel behavior, account sign-out, expiry and complete provider/discovery teardown.

iOS Screen Live requires iOS27+ in this increment; there is no older-iOS ReplayKit extension fallback. Android game audio is conditional on OS/source-app permissions. Protected media cannot be promised capture. Camera backgrounding stops camera capture; screen capture is OS/service owned.

No physical-device pass, production rollout, store approval, zero-bug guarantee or full beta certification is claimed. Private configuration, signing and the physical matrix remain acceptance gates.

Primary references: [Apple iOS capture sample](https://developer.apple.com/documentation/screencapturekit/capturing-screen-content-on-ios), [Android MediaProjection](https://developer.android.com/media/grow/media-projection), [Mux signed playback](https://www.mux.com/docs/guides/secure-video-playback), [Capacitor8.5 scene migration](https://capacitorjs.com/docs/updating/8-5).
