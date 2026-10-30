# Streaming acceptance checkpoint — October 30, 2026

The owner explicitly reports messaging and other app flows personally tested and accepted. Preserve the approved app layout. This pass focuses on streaming, not repeating the owner's other acceptance work.

## Fixed and tested

Built development previews were hiding the existing Mux test controls through import.meta.env.DEV, while credential retrieval and initialization called an oauth endpoint absent from development. The fix selects the existing test adapter only for the exact development project. Test credentials use its designated-owner authenticated action and are loaded only after an explicit click, masked and not automatically refetched on focus/reconnect. Invalid, foreign, non-test or wrong-ingest responses are refused. OBS, not a local button, starts/stops the test stream. Normal production routing and feed/controller layout are unchanged.

Branch: beta-stream-pilot-check-20261030. [PR28](https://github.com/beech80/clipt/pull/28). Tested source commit: b2f5fd4e8f035f4d47f7f03e1e60668528a7ac9a.

- Before fix: 31 targeted local streaming tests passed, including handler authentication/MFA/ownership, signatures, status/chat guards, player behavior and scheduling.
- After fix:[streaming verification](https://github.com/beech80/clipt/actions/runs/41041486860) passed 44 unit/integration checks, typecheck, built preview and one Chromium idle→active→idle fixture. That fixture uses actual synthetic HLS bytes, chat writes and zero legacy calls; all HTTP/WebSocket boundaries are intercepted before navigation, and no hosted provider is contacted.
- [Full source regression](https://github.com/beech80/clipt/actions/runs/41041486697) passed 758 app tests, 12 monitor tests, typecheck/security/CSS/build, 31 Chromium and 18 WebKit checks. These include fixture playback, not an actual OBS ingest.
- React review: existing keyed React Query infrastructure retained, owner/stream-specific key cache, hooks unconditional, explicit credential fetch, cache removal on unmount, interval cleanup and masked labelled key field preserved. No dependencies added.
- Preview deployment dpl_6ixMwb5xDEjworMBHtp8GDeE6vu3 is READY for exact tested source, development project, staging public configuration:
  https://clipttest-mpmyr4sel-matthew-beechers-projects.vercel.app/stream-setup

## Actual provider/backend observations

Development has mux-test-live and mux-live-webhook, two offline stream records and nine historical webhook receipts (latest October 15). Last provider snapshot is expired idle, not evidence of a current live stream. Unsigned webhook POST 401; unauthenticated pilot 401. Existing source handler remains Auth/MFA/designated-owner and fixed-resource guarded, refuses paid/non-test resources and durations over 300 seconds, and performs provider reads only.

The existing designated test stream is a072664f-0b65-4e72-b058-cd58a61f9515, owned by the original development test profile Beeyyuu/bee102. It is not bound to the separate approved production email account. Do not broaden ownership checks or reassign the stream to work around sign-in. The service signs into the user's real account; no service key or forged user session is used for acceptance.

Production currently has zero streams and no live-provider lifecycle tables. The existing general production workflow is separate from the development pilot; successful five-minute pilot playback will not establish unrestricted, multi-creator production broadcasting. No paid streaming, provider resource creation or production live configuration was enabled.

## Final owner-assisted OBS check — in progress

Owner says OBS is available and reports the preview status check shows idle. A fresh independent database check confirmed provider idle observed2026-10-30T10:59:12.929Z, valid until11:00:42.929Z, stream offline with playback available. This confirms a real authenticated owner/provider status check and synchronization, not active ingest/playback. The browser connector itself still requires reauthentication. Vercel preview protection remains enabled. Ordinary unauthenticated preview requests reach Vercel SSO, and the connector's protected-fetch path could not access this team deployment; no protection was disabled.

1. Open preview stream setup; check Mux test status before starting OBS. Expect fresh idle and the exact designated stream ID.
2. Explicitly load existing OBS test credentials and copy privately into OBS Custom/RTMPS settings. Never put keys in chat, screenshots or repository files.
3. Keep setup visible, start a short OBS broadcast within the existing five-minute test cap, then check status. Verify active, moving video/audio as applicable, discovery/viewer playback, and chat delivery from another signed-in tab/device.
4. Stop OBS and verify provider idle, discovery removal and disabled chat; confirm database/provider snapshot times and any new signed webhook receipt. Do not treat recorded fixture playback or stale persisted is_live as proof.

The owner-reported authenticated preflight and fresh provider/DB idle observation passed. No active OBS ingest, moving viewer playback, current signed webhook delivery or production streaming acceptance is claimed yet. App payments remain disabled; production frontend publication stays a separate release gate.

## Actual OBS and phone playback — owner-confirmed

The owner reports OBS ran and a real live broadcast played on their phone for about a minute, with quality switching between good and poor before disappearing from discovery. This is successful real ingest/viewer playback, not a long-duration stability pass or a chat-delivery observation.

Sanitized local OBS log evidence: connection succeeded at06:20:24 and Streaming Start at06:20:29, then an explicit "User stopped the stream" at06:25:19 (about4m50s). Counters show rendering lag44.3%, encoding lag31.1%, and network dropped frames18.0%. These are separate computer/render/encoder and upload-connection bottlenecks. No stream keys/URLs or raw log were copied into this report.

Provider/backend evidence: three new signed webhook receipts at11:20:42,11:25:26 and11:27:27 UTC. The last verified snapshot is disabled, observed11:27:27.271 UTC, and stream discovery correctly sees not-live. The provider's test streams are limited to five active minutes and can then become disabled; do not assume this was a production/live-player termination or silently enable paid streaming. Reference: https://www.mux.com/docs/api-reference/video/live-streams/create-live-stream .

A separate app-side issue was identified: the owner monitor skipped checks when document.hidden, while viewer proof expires after90seconds. OBS can cover/minimize the setup page. The pilot now continues its existing20-second checks for the same bounded five-minute session while the tab remains open; backend authentication, freshness expiry, provider test limit and production paths are unchanged. This mitigates browser-visibility stalls; it cannot guarantee timers during OS suspension, tab closure or discarded tabs. Additional executable component-timer tests cover hidden pages, expiry, pending-request exclusion and production exclusion.

Basic OBS→Mux→CLIPT phone playback: passed by owner observation with supporting encoder/provider records. Extended stable streaming: not passed. Real chat send/receive and a second stable encoder run were not reported. The owner accepts other app flows; do not reopen messaging/device testing generally.
