# Invited web beta: computer OBS broadcasting

Owner approved paid Mux broadcasting for explicitly invited testers on 2026-11-01, with a $25/month planning budget. This does not authorize app checkout, donations, phone capture, public broadcasting or an unbounded provider bill.

## Limits and privacy

- One unresolved broadcast globally; stop/recovery must finish before another can start.
- 30-minute fixed session deadline, including encoder preparation time.
- Two starts per owner in a rolling 24 hours.
- 300 full reserved broadcast minutes per UTC calendar month across all users. Failed/short sessions are not refunded automatically. The isolated provider acceptance test reserves two minutes.
- At most five concurrently authorized viewer sessions. Viewer leases and signed Mux playback URLs expire together within three minutes and no later than the broadcast deadline.
- Mux signed playback only. Public stream rows contain a `clipt-obs:<stream UUID>` marker, never a stream key or a signed URL.
- Stream keys are fetched only on the owner's explicit request; UI clears them on backgrounding, account change or after one minute. They are not persisted in local storage or React Query.
- Follow, creator links, game channels, live chat and the existing viewer remain in use. Development OBS/native tests remain separate.

The minute reservations are an application allowance, not a dollar billing cap. Mux's account can contain other usage; encoding resolution, stored recordings, delivery and cleanup delays can affect cost. Recommend OBS 360p/15fps on a slow computer or 720p/30fps when supported; the provider is configured for signed Plus video and a maximum recording resolution of 1080p.

## Provider setup and independent shutdown

The operations worker is bound to the immutable GitHub repository/owner IDs, main branch, exact workflow path, GitHub-hosted runner and reviewed workflow/script hashes. Its short-lived GitHub OIDC token never supplies Mux or Supabase administrator credentials to the runner.

One-time bootstrap creates a Mux signing key and the production OBS webhook. Private responses go directly from the Edge Function into Supabase Vault through a service-only RPC. A lost/ambiguous setup outcome remains claimed and requires review; it is not retried blindly. No secrets are queued through pg_net.

A SQL-only minute job revokes local LIVE eligibility at expiry, invitation/session revocation or account erasure. Independent five-minute operations reconcile provider state and disable expired resources. Provider continuous duration is also bounded. A missing/stale healthy worker prevents new sessions; closing the browser does not extend the deadline or act as a shutdown mechanism.

Mux webhooks are signature checked and then re-read against Mux before updating LIVE. Stale events cannot resurrect an ended session. Failed creation is durably uncertain; reconciliation must finish before capacity is released. Account deletion first confirms provider shutdown; it cannot silently delete its only cleanup record. This initial live-only beta removes this OBS session's Mux recordings after shutdown, verifying each asset's live-stream ownership and subsequent absence; it does not retain a replay. Cleanup failures remain durable and block a false completion.

## Rollout gate

Backend configuration defaults disabled. Enable only after SQL/security/authorization tests, production UI browser fixtures, independent worker bootstrap and a real bounded Mux encoder/playback/webhook/shutdown acceptance check pass.

Production acceptance uses a synthetic 90-second maximum session, a 60-second 360p encoder and short signed playback. It never impersonates a user or publishes an invented user stream. The reviewed runner must confirm video decoding, rejection of unsigned playback, signature-verified webhook receipt and provider disable. This is a provider/encoder test, not a claim that an actual user's OBS application or a physical native phone broadcast was tested.

## Owner steps after rollout

In CLIPT: Go Live → Computer live — OBS → Prepare OBS broadcast → Get OBS credentials. Paste Server and Stream key into OBS → Settings → Stream → Custom. Start OBS and use Check status; LIVE is provider-confirmed. Use Open viewer and live chat to watch from another invited sign-in. Finish with End broadcast and Stop Streaming in OBS.

In Mux: Organization Settings → Billing → Alerts. Add whole-dollar alerts at $20 and $25 to beecher@cliptgaming.com. Mux alerts are best effort and do not pause usage; this setting requires dashboard access when the connected browser cannot authenticate.

## Remaining boundaries

Phone Camera Live and Screen Live, native signing, physical native-device acceptance and app-store release remain deferred. Computer OBS is not mobile web camera or screen capture. App checkout and gifts/donations remain disabled. Backblaze's download cap stays at $0 under the owner's beta decision.

Final validation and deployment receipt must be appended after the checks actually run.
