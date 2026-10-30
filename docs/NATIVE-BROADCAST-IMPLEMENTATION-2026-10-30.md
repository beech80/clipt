# Native phone broadcasting implementation — October 30, 2026

This is an implementation and acceptance record. It is not a claim of a successful physical phone broadcast.

## Implemented source

- Exact Capacitor8.6.0 runtime and reproducible native host generator with the current iOS scene lifecycle. Hosts load bundled assets, not remote Lovable content. App identity and existing React UI are retained.
- Android native Camera2/MediaCodec H.264/AAC publishing, Screen Live via MediaProjection foreground service, conditional microphone/game audio, persistent notification/Stop, native camera preview/switch/mute/end, native heartbeats, bounded reconnect, permission revocation, thermal/expiry handling.
- Pinned RootEncoder2.8.1 RTMPS implementation, explicit TLS hostname verification and stripped third-party Android logging. Publishing requires a minified nondebug build. Debug compilation is supported but is not a publishable beta artifact.
- iOS native AVFoundation/VideoToolbox camera publishing and iOS27 ScreenCaptureKit picker/output/background capture, with native preview/switch/mute/end, permission/interruption handling, bounded reconnect and native expiry/heartbeats.
- Pinned HaishinKit.swift2.2.5 source revision and licenses. iOS capture capabilities are based on native APIs and actual encoder creation, with SDK/OS gating. The iOS27 screen path is built only with an actual SDK27+ toolchain.
- Authenticated native session creation/status/current/end; owner/invitation/MFA/current-session/account-erasure checks; one publisher per owner, creation limits and atomic hashed one-use grants. Native-only grant redemption returns scoped transport credentials. The webpage never receives a Mux API token, signing key or ingest stream key.
- Signed provider webhook handling and reconciliation, provider-verified LIVE state, independently bounded leases, private signed playback and block checks. Native heartbeats refresh provider proof even while the WebView is backgrounded.
- Existing Go Live adds Camera Live / Screen Live only when the installed native plugin advertises real support. Source/quality/orientation/audio options, status recovery, independent mute controls and explicit End are wired. OBS, Live Discovery, viewer, game associations, profiles/chat and navigation are retained.
- Signed playback markers bind authorization to the exact stream. Private tokens are not persisted to browser storage.

## Source and verification

Draft PR: https://github.com/beech80/clipt/pull/30  
Branch: feature-native-mobile-broadcasting-20261030

Validated source head a6ab6abdf5ad8eebeb7be6e08a12bc3946c59427:

- Native builds: https://github.com/beech80/clipt/actions/runs/41083842239 — Android minified release APK plus native JUnit tests; full iOS27 simulator app build and8 Swift tests passed.
- App validation: https://github.com/beech80/clipt/actions/runs/41083842261 —794 app unit tests,12 monitor tests, TypeScript, security audit, CSS, web build, Chromium/WebKit regression checks passed.
- Streaming: https://github.com/beech80/clipt/actions/runs/41083842242 —48 existing stream unit checks and4 browser flow tests passed. The new native browser tests simulate the Capacitor transport and intercept all hosted requests. They prove UI/protocol integration, not real capture or RTMPS.
- PostgreSQL lifecycle tests execute the actual native SQL: ownership, grant replay, fixed expiry, signed markers, account revocation and denial of browser-role access.
- Local13 foundation tests also ran and passed. The attached Windows computer is slow; cloud native builds provide the native compile evidence.
- Earlier failures were investigated and fixed: Android JSONObject API mismatch, unavailable iOS hardware helper, missing explicit Cordova dependency for standalone package tests, SQL CASE expression parsing and isolated OBS test dependency mocks. No original behavioral assertion was removed to obtain a pass.

## Deployed development state

Project akiksrlzdqvipqbbjxpw only:

- Native private tables/functions installed; both tables have RLS and no anon/authenticated SELECT access. Browser roles cannot execute the service-only RPC.
- native-broadcast-session Edge Function version1 deployed from the reviewed source; custom per-action authentication replaces gateway JWT-only enforcement for native grants/webhooks.
- Probes returned GET405, OPTIONS204, anonymous current/status401, disabled redeem503, invalid cleanup401 and forged webhook401. Responses use no-store/private caching.
- No native session or provider resource was created. Native provisioning remains disabled until required Mux signing/webhook/worker configuration is present and approved.
- SQL-only per-minute expiry is installed separately. It sends no secrets through pg_net. External reconciliation still requires its scoped worker token and scheduler.
- Production project slnjliheyiiummxhrgmk, production frontend, billing and app stores were not changed.

## Required private configuration and installable builds

Do not paste credentials into chat, source code, VITE variables, screenshots or logs.

Supabase development Edge secrets:

- CLIPT_NATIVE_TEST_OWNER_ID: the confirmed development auth user for the approved owner email. Test publishing is restricted to that account; other viewers require explicit beta membership even when ordinary development access is open.
- Existing MUX_TOKEN_ID / MUX_TOKEN_SECRET must have the required video permissions in the intended Mux environment.
- MUX_SIGNING_KEY_ID and MUX_SIGNING_PRIVATE_KEY: matching private playback signing pair in that same environment. The server accepts the provider's base64 PEM or PEM format.
- MUX_NATIVE_WEBHOOK_SECRET: signing secret for the dedicated callback /functions/v1/native-broadcast-session?hook=mux. Keep the existing OBS webhook intact.
- External worker: store that same scoped token in the GitHub encrypted repository secret CLIPT_NATIVE_RECONCILE_TOKEN, run the native cleanup workflow manually and verify success, then set repository variable CLIPT_NATIVE_RECONCILE_ENABLED=true. The worker runs every5 minutes after merging; failure email follows the existing verified Actions notification setup. Keep the SQL expiry job as well.
- CLIPT_NATIVE_RECONCILE_TOKEN: independent high-entropy URL-safe worker token,64–256 characters. This authorizes only the cleanup endpoint.
- Enable test mode only after those checks: CLIPT_NATIVE_BROADCAST_ENABLED=true, CLIPT_NATIVE_MUX_CREATE_ENABLED=true, CLIPT_NATIVE_MUX_MODE=test, CLIPT_NATIVE_MAX_DURATION_SECONDS=300, CLIPT_NATIVE_MUX_PAID_APPROVED=false.
- Paid/general production streaming is a separate approval and release decision. The default five-minute test limit is not a launch-ready unlimited streaming service.

A real device build must bundle the actual reviewed development Supabase URL/publishable key. CI uses isolated HTTP fixtures: its compile-only APK is not a configured end-user app.

iOS: use Xcode27+, verify the SDK, set CLIPT_IOS27_SDK=1 and CLIPT_NATIVE_BACKEND_READY=true only for a configured development build, run the host generator and sign the App target with the owner's Apple setup. An unsigned simulator app cannot be installed on a physical iPhone. No App Store/TestFlight upload has been authorized or performed.

Android: use Java21/SDK36, run the host generator, then build a minified nondebug beta/release with the explicit native flag. A local debug signing key can be selected only for an owner test build with cliptDevelopmentSigning=true; it is not a store signing configuration. Current native engine requires Android8/API26+.

## Outstanding acceptance gates

- Private Mux configuration, actual authenticated native session creation/redemption/playback, signed webhook delivery and scoped external cleanup-worker delivery.
- Real configured/signable iPhone and Android builds. Owner has confirmed both phones and iOS27+. Apple signing setup is pending confirmation.
- Physical Camera Live and Screen Live on both platforms: actual image/audio playback from a second device, switch to a game, microphone/game-audio permissions, camera switch, mute, denied consent, backgrounding, screen lock, OS Stop, interruptions, Wi-Fi/cellular recovery, process termination, orientation, thermal/battery behavior and provider/discovery/chat teardown.
- Android game audio is conditional on OS/source-app permissions. Protected media is not captured. Camera backgrounding ends camera capture; screen sharing is service/OS-capture owned.
- No native physical pass, production rollout, store compliance approval, guaranteed zero bugs or complete beta certification is claimed here.

Primary references: [Capacitor8.5 scene migration](https://capacitorjs.com/docs/updating/8-5), [Apple ScreenCaptureKit](https://developer.apple.com/documentation/screencapturekit), [Android MediaProjection](https://developer.android.com/media/grow/media-projection), [Mux signed playback](https://www.mux.com/docs/guides/secure-video-playback).
