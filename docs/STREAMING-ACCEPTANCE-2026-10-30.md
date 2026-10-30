# Streaming acceptance — October 30, 2026

## Result

The owner has personally accepted messaging and other application flows. This pass verifies streaming only and preserves the approved app/controller layout.

**Basic real OBS → Mux → CLIPT phone playback passed by owner observation, supported by local encoder and provider records. Extended stability did not pass. General production broadcasting is not enabled by this test.**

## Real test evidence

The owner reports seeing their live broadcast on the phone for about a minute. Picture/connection quality fluctuated and the stream later disappeared from discovery.

Sanitized local OBS log:
- RTMPS connection succeeded at 06:20:24; streaming started at 06:20:29.
- The log records “User stopped the stream” at 06:25:19, about 4 minutes 50 seconds later. This does not prove when or why phone playback disappeared.
- Rendering lag: 44.3%; skipped frames due to encoding lag: 31.1%; dropped frames due to insufficient bandwidth/connection stalls: 18.0%.
- Actual encoding was x264, CBR 6,000 kbps, 844×480 at 30 FPS. A missing Intel Quick Sync encoder had previously prevented startup; selecting the installed x264 encoder allowed the connection.
- No stream keys, ingest URLs, raw logs or private credentials were added to this report.

OBS times above are America/Chicago on October 30 (CDT). The corresponding current provider webhook receipts were at 11:20:42, 11:25:26 and 11:27:27 UTC. The last provider snapshot was disabled at 11:27:27.271 UTC and the stored stream was not-live. These new receipts follow signature validation and provider re-reading; they supplement the prior nine historical receipts.

The existing Mux resource is a test stream capped at five active minutes. Disabled/offline provider state is consistent with removal from live discovery; this evidence does not establish one exclusive cause for the earlier interruption. [Mux test-stream specification](https://www.mux.com/docs/api-reference/video/live-streams/create-live-stream).

## Implemented fixes

Built previews had hidden the existing Mux pilot through import.meta.env.DEV and requested credentials/initialization from an oauth endpoint absent from development. Pilot selection now uses the exact development project. Credentials use the existing designated-owner authenticated test action, are explicitly requested, masked, isolated by owner/stream and not automatically refetched on window focus/reconnect. Invalid/non-test/foreign/wrong-ingest responses fail closed. OBS remains the actual start/stop control for this resource.

A separate app defect could contribute to early discovery disappearance: the owner monitor skipped checks when document.hidden, while verified viewer state expires after 90 seconds. OBS can cover/minimize the browser. The test monitor now continues its existing 20-second checks while the tab stays open, for the same bounded five-minute session. In-flight exclusion, timer cleanup, backend freshness expiry and provider restrictions remain. Browser timers still cannot guarantee operation during OS suspension, tab closure or tab discard; this is not server-side reconciliation for an unrestricted live service.

No feed/controller redesign, backend permission expansion, provider resource creation, paid-stream activation or frontend production publication occurred.

## Automated verification

Tested source: dfb005563532410b68434f73159a5f223d2df7f5.
[PR28](https://github.com/beech80/clipt/pull/28) merged as f4c6c81ba778a0bea38cd15f2ba2f4d683867f16.

- [Focused streaming run](https://github.com/beech80/clipt/actions/runs/41049393182): 48 unit/integration checks passed; typecheck/build passed; one built-preview Chromium fixture passed with actual synthetic HLS bytes, idle → active → idle, chat and zero legacy endpoint calls. All fixture HTTP/WebSocket boundaries were intercepted before navigation.
- Four new tests execute the actual dashboard monitoring effect under a hidden document, checking refresh, the five-minute deadline, interval cleanup, pending-request exclusion, missing playback and production exclusion.
- [Full reviewed source run](https://github.com/beech80/clipt/actions/runs/41049393211): 762 app tests, 12 monitor tests, 31 Chromium and 18 WebKit checks passed, with typecheck/security/CSS/build.
- Before the preview-routing fix, 31 targeted local streaming tests passed. They are historical baseline evidence, not extra tests in the final count.
- React review retained the existing keyed React Query architecture, unconditional hooks, explicit credential request, owner/stream cache isolation and effect cleanup. No dependencies added.

Updated development preview, READY:
https://clipttest-2n4vm928g-matthew-beechers-projects.vercel.app/stream-setup
Deployment: dpl_7GNbmBJ4wCFV1MVWnX4VpHdJJdET, target preview, exact tested source. Preview configuration was independently confirmed staging + the development Supabase project. Deployment Protection stays enabled. The connector's protected fetch lacks access to this team deployment, and Opera still requires reauthentication; no automated authenticated hosted-browser pass is claimed.

## Scope and remaining limits

The owner has accepted other app flows; do not reopen general messaging/device acceptance. Real ingest and phone playback are verified within the test above. Live chat UI/server guards passed automated tests, but real cross-device chat delivery was not reported. Stable long-duration broadcasting was not verified.

The adapter is still limited to the original designated development owner/profile Beeyyuu/bee102 and fixed test resource. Production has no streams or provider lifecycle state; a five-minute development pilot does not enable general multi-creator production broadcasting. Current disabled provider state should be checked before a future test; do not bypass test limits or enable paid resources without authorization.

For a lower-load future diagnostic run, start with x264 ultrafast, 640×360 at 15 FPS, CBR around 1,000 kbps, and a two-second keyframe interval. These are conservative troubleshooting settings, not a measured guaranteed fix for this computer/network. Do not edit an active OBS profile behind the running application's back. References: [OBS encoding performance](https://obsproject.com/kb/encoding-performance-troubleshooting), [OBS connection troubleshooting](https://obsproject.com/kb/stream-connection-troubleshooting), [Mux encoder settings](https://www.mux.com/docs/guides/configure-broadcast-software).

App payments remain disabled. A production frontend release and general production streaming configuration remain separate release work.
