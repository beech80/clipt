# Native phone broadcasting implementation — October 30, 2026

This records implemented source and observed verification. The development server's configuration checks now pass. Native broadcasting is not certified for launch: real provider delivery/playback and physical-device acceptance remain incomplete.

## Configuration update — October 31, 2026

- The private RSA signing key now imports: the unauthenticated playback probe reaches AUTHENTICATION_REQUIRED. Matching the signing ID/private key and Mux environment still needs real authenticated playback.
- [Manual external cleanup](https://github.com/beech80/clipt/actions/runs/41217511448) passed at 11:00 AM Chicago: checked0, stopped0, pending0, oktrue. The scoped token works between GitHub and development Supabase. [Automatic external cleanup](https://github.com/beech80/clipt/actions/runs/41226669924) also passed on October31 at12:53PM Chicago with checked0/stopped0/pending0/oktrue, confirming the saved schedule gate and scoped authentication. Actual expired-provider teardown still requires a real broadcast.
- All six owner/test gates and signing-key configuration pass their finite readiness checks. The development test is restricted to the confirmed beecher@cliptgaming.com account, test mode and300seconds; paid approval is false.
- Earlier private diagnostics identified MUX_NATIVE_WEBHOOK_SECRET as missing/incomplete. The owner has now created the native Mux webhook and saved its endpoint-specific Signing Secret in development. The read-only redemption probe now returns INVALID_GRANT for a missing grant rather than NATIVE_DISABLED: the configuration guards pass. Playback still correctly requires user authentication. Actual signed webhook delivery and matching private playback remain physical-broadcast checks. No credential value was retrieved or logged.
- Readiness diagnostics are fixed labels only, deduplicated per worker; public errors and all enforcement predicates are retained. Development native-broadcast-session runtime version12 is active after the secret update; its reviewed source is unchanged from the version11 diagnostic deployment. PR34 also patches newly published build-tool advisories with exact minimatch11.0.1/glob14.0.2 overrides and a regenerated lockfile; the security audit passes with0 vulnerabilities.
- The owner is using only the iPhone now. Native installation/signing still needs the Mac and Xcode. [First-test handoff](NATIVE-IPHONE-FIRST-TEST-2026-10-31.md) records the verified package, installation steps and acceptance checks. No physical native broadcast has passed acceptance, and no native provider resource was created by these read-only probes.

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
| Private setup diagnostics and build-tool security patches | [34](https://github.com/beech80/clipt/pull/34) | 4e29aa01111b29ed8cffadf9e4b76d32fe4ba1b6 |

The branches retain feature-native-mobile-broadcasting-20261030, feature-native-owner-test-package-20261030, feature-ios-owner-device-package-20261030 and fix-native-signing-key-normalization-20261030. The test runs below identify the exact source heads; merged/documentation commits have different identifiers.

## Automated evidence

- [Latest app/source verification](https://github.com/beech80/clipt/actions/runs/41222107987), source6545f2dcf13a9e416d5373d433df831ddbd76707:817 app tests and12 monitor tests passed;0 failures; typecheck, CSS, web build, npm audit (0 vulnerabilities), Chromium and WebKit regressions passed. This includes the new guard/redaction and patched build-tool compatibility checks. Signing tests verify actual JWT signatures over8 supported key-format variants and reject unsafe inputs.
- [Latest native builds](https://github.com/beech80/clipt/actions/runs/41222108000), same source: Android minified build/tests, iOS simulator and physical-device SDK builds, and14 Swift tests passed. The focused native session suite also passed20/20 locally.
- [Native verification](https://github.com/beech80/clipt/actions/runs/41111317236), source475864d36aeee85e1273256a3e1b12f559dd936b: Android compile/minified APK/native unit checks passed; iOS simulator and physical-iPhone-SDK builds passed;14 Swift tests passed with0 failures. The physical SDK check is now part of normal native CI.
- [iPhone owner device archive](https://github.com/beech80/clipt/actions/runs/41111317044), same native source: actual iPhoneOS27.1 arm64 archive passed, native identity checked, development public key accepted,8 owner/configuration boundary checks passed.
- [Android owner package](https://github.com/beech80/clipt/actions/runs/41104358378), source70afa0af6caff0229d9dfc7808899e415ff865cc:4 packaging boundary tests, development public-key acceptance, Android native tests, minified APK and APK Signature Scheme v2 verification passed. Later iPhone/backend changes do not alter that Android client's implementation.
- [Existing streaming integration checks](https://github.com/beech80/clipt/actions/runs/41094875808):48 stream unit checks and5 browser flow cases passed. Native browser cases simulate the Capacitor transport and intercept hosted requests; they do not prove capture or real RTMPS.
- Lifecycle SQL tests execute the actual native SQL for ownership, grant replay, fixed expiry, viewer invitation, signed markers, account revocation and browser-role denial.

The device SDK caught pixelFormat/updateContentFilter/updateConfiguration calls unavailable on iPhone despite the earlier simulator pass. Those calls were removed in favor of the documented iOS lifecycle and the stronger device compile now covers them. No failing behavioral assertion was removed.

## Device packages

The successful Android run provides CLIPT-development-owner-test-Android: APK, BUILD-INFO.json, README and SHA256SUMS. It targets development, not localhost. Its temporary developer signing key is for owner testing; future updates can require uninstalling that development app. A stable approved signing key is required for normal upgradeable distribution.

The successful iPhone run provides CLIPT-development-owner-test-iPhone: prepared Xcode project, unsigned arm64 archive, build metadata, instructions and checksums. It is not a signed installable IPA. On the owner's Mac, scripts/ios-owner-test.mjs validates the actual SDK/team/paired-device identifiers, preserves the SDK27 flags during package resolution/build, and installs only with --install. Apple signing/provisioning still requires the owner's account.

Artifacts expire after7 days (November6,2026). Correction to the earlier rebuild note: the prepared Xcode project is self-contained and does not include/install npm manifests. Direct Git tree comparison confirmed that its bundled client/native code, host/branding generation and Mac installer match current reviewed sources. The CI dependency-manifest patches do not require rebuilding this unchanged prepared client package. See NATIVE-ANDROID-OWNER-TEST.md and NATIVE-IOS-OWNER-TEST.md for installation/acceptance instructions. No physical screenshot or broadcast is represented by these artifacts. The original1024px CLIPT icon was inspected; its opaque PNG format was verified.

## Observed development state

Project akiksrlzdqvipqbbjxpw only:

- Private native tables/functions and RLS are installed; anon/authenticated cannot SELECT the native tables or execute the service-only RPC.
- native-broadcast-session runtime version12 is active after the owner saved the webhook secret; its source matches the reviewed version11 deployment. Index/protocol changes add private fixed-label diagnostics and reuse equivalent readiness guards; unchanged deployed dependencies were compared and preserved. Gateway verify_jwt remains false because the function performs per-action authentication for user JWTs, one-use grants, scoped cleanup and signed provider callbacks.
- Initial October30 probes after that deployment returned PLAYBACK_UNAVAILABLE for playback initialization and NATIVE_DISABLED for grant redemption. The owner confirmed using an Access Tokens → Token Secret in the signing field, then replaced it with the signing pair. The October31 update above records the successful private-key import. No credential value was retrieved or logged.
- SQL inspection found0 native sessions. The SQL-only per-minute expiry job succeeded at20:20UTC on October30. It sends no secrets through pg_net.
- Anonymous user requests and forged webhooks were previously verified as denied with private/no-store response caching.
- No native provider stream was created by these checks. Bounded development publishing configuration now passes; signed-in owner/grant authorization is still mandatory. No paid native stream was enabled.
- The last development advisor snapshot still included its leaked-password-protection warning. No blanket Supabase security clearance is claimed; production and development settings must not be confused.

Production project slnjliheyiiummxhrgmk, production frontend, payment gates and app stores were not deployed or enabled by this work.

## Private setup and remaining verification

Do not put credentials in chat, source, VITE variables, screenshots, artifacts or logs.

1. The development private signing key now imports successfully. Verify its MUX_SIGNING_KEY_ID belongs to the matching pair and the same Mux environment as the Video API token during authenticated playback. The earlier access-token/signing-key mismatch is resolved at the import step.
2. The owner created the dedicated native webhook and saved MUX_NATIVE_WEBHOOK_SECRET; the server's configuration guards now pass. Keep the OBS webhook. Verify actual signed delivery during a real native broadcast; the earlier download_failed video-import attempt was not webhook evidence.
3. The scoped CLIPT_NATIVE_RECONCILE_TOKEN is configured and the manual workflow passed. Repository variable CLIPT_NATIVE_RECONCILE_ENABLED=true is now independently confirmed by the successful scheduled run41226669924. Verify real expired-provider teardown during device acceptance. The5-minute worker supplements, rather than replaces, SQL expiry.
4. The confirmed beecher@cliptgaming.com development owner and all six test settings now pass configuration checks. Existing MUX_TOKEN_ID / MUX_TOKEN_SECRET must retain required Video permissions in the same environment; provider authorization is still exercised by the real broadcast test.
5. Bounded development gates are saved: CLIPT_NATIVE_BROADCAST_ENABLED=true, CLIPT_NATIVE_MUX_CREATE_ENABLED=true, CLIPT_NATIVE_MUX_MODE=test, CLIPT_NATIVE_MAX_DURATION_SECONDS=300 and CLIPT_NATIVE_MUX_PAID_APPROVED=false. A request without a grant is correctly rejected as INVALID_GRANT, demonstrating that configuration guards pass without creating a stream. Paid/general production streaming is a separate approval/release decision.

## Outstanding physical acceptance

Use the configured signed native builds on the actual iPhone and Android phone and view from a second device. Verify camera image/audio, camera switching, microphone and game-audio mute, system screen consent, switching to a game, denied permissions, OS Stop, backgrounding/lock/interruption, network recovery, orientation, thermal/battery behavior, current video/chat/profile/game-channel behavior, account sign-out, expiry and complete provider/discovery teardown.

iOS Screen Live requires iOS27+ in this increment; there is no older-iOS ReplayKit extension fallback. Android game audio is conditional on OS/source-app permissions. Protected media cannot be promised capture. Camera backgrounding stops camera capture; screen capture is OS/service owned.

No physical-device pass, production rollout, store approval, zero-bug guarantee or full beta certification is claimed. Apple signing, real provider delivery/private playback, expired-provider teardown and the physical matrix remain acceptance gates. The automatic cleanup invocation itself has now been observed successfully.

Primary references: [Apple iOS capture sample](https://developer.apple.com/documentation/screencapturekit/capturing-screen-content-on-ios), [Android MediaProjection](https://developer.android.com/media/grow/media-projection), [Mux signed playback](https://www.mux.com/docs/guides/secure-video-playback), [Capacitor8.5 scene migration](https://capacitorjs.com/docs/updating/8-5).
