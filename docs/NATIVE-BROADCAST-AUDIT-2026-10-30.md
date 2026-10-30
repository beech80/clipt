# Native mobile broadcasting audit — October 30, 2026

Scope: add Camera Live and Screen Live incrementally to CLIPT while preserving React/Vite, Supabase/Mux, the existing interface, OBS, Live Discovery and Live Viewer. This is a repository audit and first shared-code foundation, not a native broadcasting completion report.

## Existing implementation

| Area | Evidence | Status |
| --- | --- | --- |
| Go Live / offline draft / game selection | src/pages/StreamSetup.tsx, src/components/streaming/StreamDashboard.tsx, src/services/streamService.ts | Implemented web UI; native mode selector absent |
| OBS publishing and phone viewing | docs/STREAMING-ACCEPTANCE-2026-10-30.md | Owner observed real playback. Source computer/network unstable; this is the five-minute designated development Mux pilot |
| Mux authenticated owner lookup, ingest credentials, playback ID | supabase/functions/mux-test-live/index.ts | Existing fixed test resource, development-only, Auth/MFA/ownership gates, no general resource provisioning |
| Verified provider webhooks / bounded live proof / chat guards | supabase/functions/mux-live-webhook/index.ts, database/verified_live_chat.sql | Implemented in development; production provider lifecycle not installed |
| Viewer / HLS / discovery / creator / follow / chat | src/pages/Streaming.tsx, src/pages/LiveDiscovery.tsx, src/components/streaming/StreamPlayer.tsx | Existing features to reuse; unknown viewer counts remain unknown rather than fabricated |
| Legacy “broadcast engine” | src/components/streaming/broadcast/BroadcastEngine.tsx | Creates encoding-session metadata and a local active state; it does not capture, H.264/AAC encode or publish mobile media. Do not use its active row as LIVE proof |
| General legacy provisioning | supabase/functions/mux-stream/index.ts | Fails closed with503; not a general Mux live-creation API |
| Capacitor | package-lock.json | core/cli/ios/android installed at7.6.9 |
| iOS native project / Swift capture / extensions | repository tree | Missing |
| Android project / MediaProjection service / encoder | repository tree | Missing |
| Custom native Capacitor broadcaster plugin | repository tree | Missing |
| Physical native broadcasting tests | test evidence | None; existing mobile playback occurred in a browser |

The starting capacitor.config.ts loaded an obsolete remote Lovable site outside production, allowed cleartext and contained unsupported Capacitor7 settings. tsconfig.node.json did not typecheck that file. This is especially unsuitable before adding privileged capture/credential plugins.

No java, adb, gradle or xcodebuild was found on the attached Windows environment's PATH. The owner has a Mac outside this attached workspace; its Xcode/device/signing configuration is unverified. No claim is made that an IDE is absent from every machine.

## Current platform requirements — verified against primary documentation

### iOS

- Camera Live: native AVFoundation camera/microphone capture, VideoToolbox H.264 and AAC audio encoding, and a reviewed/pinned RTMPS publisher. Handle camera changes, mute, interruption, orientation and thermal limits in native code.
- Screen Live on iOS/iPadOS27+: Apple's current ScreenCaptureKit documentation replaces ReplayKit streaming and removes the broadcast-extension requirement. Use SCContentSharingPicker, SCStream samples and the supported background capture mode. The official symbol metadata reports iOS27 introduction for ScreenCaptureKit/picker and iOS27 deprecation for RPBroadcastSampleHandler.
- Older supported iOS: ReplayKit Broadcast Upload Extension with RPSystemBroadcastPickerView/RPBroadcastSampleHandler, a separately signed extension target and narrowly shared credentials/state. Its capture process must survive the host WebView backgrounding. Do not assume JavaScript can keep a capture session alive.
- Compile/version-gate both paths against an appropriate SDK and validate on devices. Capacitor7's minimum documented tooling is not proof of iOS27 lifecycle/SDK compatibility. Review an upgrade separately before choosing a supported device range; no blind major upgrade was made.
- System audio is conditional. Protected content, app/OS restrictions and interruptions must be respected. Camera background behavior must be capability-gated rather than assumed equivalent to screen sharing.

Sources: [Apple ScreenCaptureKit](https://developer.apple.com/documentation/screencapturekit), [RPBroadcastSampleHandler](https://developer.apple.com/documentation/replaykit/rpbroadcastsamplehandler), [Capacitor7 iOS](https://capacitorjs.com/docs/v7/ios).

### Android

- Camera Live: native camera/microphone capture and MediaCodec H.264/AAC encoding with RTMPS output.
- Screen Live: MediaProjection capture owned by a foreground service, persistent notification/Stop action, per-session system consent and native lifecycle handling. Declare the correct projection/microphone/camera foreground-service types and permissions for the supported Android targets.
- Respect projection revocation/onStop, device locking, permission denial and process termination. Do not reuse a consumed capture-consent token for a new projection.
- Game audio requires AudioPlaybackCapture on supported versions (introduced Android10), recording permission, consent, the same user profile and a source app that allows capture. Microphone-only/silent fallback must be explicit; never claim every game can provide audio.
- Reconnection can resume network publishing while existing capture remains valid. A terminated/revoked projection requires fresh consent; no silent recapture.

Sources: [Android MediaProjection](https://developer.android.com/media/grow/media-projection), [audio playback capture](https://developer.android.com/media/platform/av-capture), [foreground service types](https://developer.android.com/develop/background-work/services/fgs/service-types).

### RTMPS publisher selection

Do not invent RTMP output from browser MediaRecorder chunks. Evaluate native RTMPS libraries against actual capture-sample, TLS, reconnect, current SDK and audio-mixing requirements; pin the selected versions and preserve licenses. HaishinKit's official iOS/Android repositories advertise BSD-3-Clause native publishing and are candidates, not installed or verified dependencies in this change.

Sources: [HaishinKit.swift](https://github.com/HaishinKit/HaishinKit.swift), [HaishinKit.kt](https://github.com/HaishinKit/HaishinKit.kt).

## First implementation increment

- Hardened bundled Capacitor configuration: existing application ID retained, CLIPT display name, no remote server URL, no cleartext/mixed content, zoom supported and native logging disabled. Removed invalid/dead legacy config fields; added config to TypeScript checks. No native launch/splash feature is claimed from an uninstalled plugin.
- Typed native plugin contract for camera/screen, permissions/capability outcomes, mute, camera changes, stop and transport status. This is an integration contract; no native encoder implementation exists yet.
- 360p/15FPS default, H.264/AAC, two-second keyframes, explicit bps units and portrait/landscape dimensions. Higher preset IDs are allowed only when the native engine advertises support.
- Capability parsing fails closed for web, absent/unregistered plugins, mismatched protocols/platforms, unsupported quality/audio and screen capture without cross-app background support.
- Bridge accepts only an opaque broadcast grant plus validated selection and fixed encoder settings, not arbitrary provider URLs/keys. Provider errors become fixed messages. Stop remains callable after capability/permission loss.
- Native transport “publishing” is distinct from server-confirmed LIVE; no client writes streams.is_live.
- No pretend Camera Live/Screen Live buttons were inserted into the approved web UI. They will be wired when a real native engine and authorized backend session issuer are available. OBS paths are unchanged.

The shared bridge cannot mint grants, authorize users, encode frames, publish RTMPS or validate a physical device by itself. Its validation is defense in depth; actual native code and the backend must independently enforce the protocol.

## Required backend increment

Reuse streams, game associations, existing viewer/profile/chat routes and provider-verification principles. Build a real authenticated native session provisioner with current invitation/MFA/ownership rules, per-account limits, idempotency, one active publisher and owner-confirmed provider spending configuration.

Keep Mux API credentials server-only. Create or attach the owned Mux live resource and persist provider/playback IDs server-side. Issue an expiring, single-use grant bound to owner/session/mode/quality; store only its hash in a private table. Native code redeems it using a fixed HTTPS origin and keeps RTMPS secrets out of WebView URLs, JS/local storage, analytics and logs. iOS older-OS extension credential sharing must use narrowly scoped Keychain/App Group access, not public preferences.

End/revoke must stop native capture and reconcile provider state, with retries/cleanup after failures. General livestream state cannot depend on the host page staying visible or a five-minute browser timer. Verify signed webhook replay/order handling and server-side reconciliation after native crashes/network loss. For a private invited beta, review authenticated/signed playback rather than assuming a public Mux playback ID provides confidentiality.

No session-issuer endpoint, native grant table, general provider provisioning or paid production resource was created by this increment. [Mux live API](https://www.mux.com/docs/api-reference/video/live-streams/create-live-stream).

## Implementation sequence

1. Audit + shared bridge/config/quality foundation; test against current web/OBS baseline.
2. Generate the native iOS/Android application projects with the verified CLI; configure signing, app identities, permissions and version support. Add native build-only CI.
3. Implement the authenticated backend session/grant/stop lifecycle and quotas in development, using approved test resources first.
4. Implement Camera Live on both platforms, hardware encoder capability checks, native preview, camera switching, audio mute and interruption/reconnect handling.
5. Implement Screen Live with iOS27 ScreenCaptureKit, older-iOS extension support as required, and Android projection foreground service/game audio. Keep capture and credentials outside WebView lifetime.
6. Wire Camera Live and Screen Live into the existing Go Live screen based on actual engine/backend readiness. Preserve OBS and all existing viewing/chat/navigation routes. Display accurate permissions/status/quality choices.
7. Run physical-device acceptance, capacity/thermal tests, real chat/viewer/discovery/provider lifecycle checks, then stage for the separately approved native release. Do not publish app stores or activate production provider spend automatically.

## Physical-device acceptance matrix — all pending

- iPhone: Camera Live and Screen Live; screen picker/cancel/deny; switch to a game; mic/app-audio restrictions; orientation; screen lock/call interruption; Wi-Fi/cellular transition; end from OS controls; force termination; viewer playback/chat/discovery; thermal/memory behavior.
- For a range spanning iOS27 and older iOS, independently test both capture implementations. Simulator builds do not pass this gate.
- Android: camera/audio permission denial and recovery; screen consent per session; game audio allowed/disallowed; foreground notification stop; app backgrounding; projection revocation/lock; network recovery; OS process kill; playback/chat/discovery; temperature/encoder limits.
- Verify 360p15 first. Enable higher quality only after device encoder/network/thermal measurements.
- Observe native stop, provider idle and discovery/chat transition without keeping the owner WebView active.
- Credentials must be absent from browser storage, deep links, diagnostic artifacts and crash logs.

No physical native broadcasting, screen sharing, microphone/game-audio capture, native build or app-store verification is claimed. Device availability was asked asynchronously; unanswered means unknown, not approval or a passed test.
