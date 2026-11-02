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

A SQL-only minute job revokes local LIVE eligibility at expiry, invitation/session revocation or account erasure. A second Supabase minute job sends a credential-free request to a rate-limited expiry-only endpoint. That endpoint derives stopping work solely from database state and cannot provision, bootstrap, sign playback or select a healthy session from caller input. It verifies provider shutdown and recording cleanup before updating worker health. GitHub's independent five-minute operations provide additional reconciliation, bootstrap and bounded acceptance; GitHub schedule timing is not used as an exact billing clock. Provider continuous duration is also bounded. A missing/stale healthy worker prevents new sessions; closing the browser does not extend the deadline or act as a shutdown mechanism.

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

## Activation status after the first provider acceptance

The owner-approved paid request returned a signed **test** resource with a 300-second duration. The paid-mode validator rejected it before starting the encoder. Video and System write permissions were verified; signing and webhook secrets were created directly in Vault. The rejected resource was disabled and its cleanup completed; no user broadcasting was enabled.

The remaining provider step is to activate or correct non-test livestreaming in the Mux account (Organization Settings → Billing). A real paid ingest/signed playback/webhook/cleanup acceptance must pass afterward. If the dashboard already shows Pay as you go, verify the token's account/environment against that organization before retrying. Do not paste any keys or payment details in chat.

The $25 planning budget is not a provider billing cap. Add $20 and $25 spending alerts to beecher@cliptgaming.com in Mux Billing. Dashboard confirmation is still pending.

## Verified rollout receipt — 2026-11-02 00:49 UTC (November 1 in Chicago)

- Implementation PR [43](https://github.com/beech80/clipt/pull/43) merged as `ede46ba96eb9b711ec2c9aac436eb5bc37c26161`.
- Recovery/minute-expiry PR [44](https://github.com/beech80/clipt/pull/44) merged as `444d9a78f579012b8df854724b46562a1040d500`.
- Production Vercel deployment `dpl_FLm2xWzggo9gQAdjiSLKvuZV6iwK` is READY at the stable web-beta alias, built from the tested UI merge `ede46ba96eb9b711ec2c9aac436eb5bc37c26161`. Subsequent backend/operations changes do not require a different frontend bundle.
- Production `obs-broadcast-session` is version 7; `account-deletion` is version 5. Signing and webhook secrets are present in encrypted Vault, never returned to the operator.
- Validation run [41368401843](https://github.com/beech80/clipt/actions/runs/41368401843): 845 application tests, 12 monitoring tests, typecheck, CSS checks, build and dependency audit passed with zero audit findings. Chromium regression/private-media checks and macOS WebKit conversion, channel/UI and repeated feed checks passed. The separate production OBS build verified five desktop/tablet/phone scenarios; development streaming checks also passed.
- The Safari upload-readiness regression was corrected by checking decoded readiness after the same selected video's play promise resolves. The conversion test now withholds playing/preload events from React and passes through a real explicit gesture.
- Both Supabase minute jobs executed successfully at consecutive minute boundaries. Provider-expiry requests returned HTTP 200 without timeouts. The cron command contains neither Authorization nor API-key headers.
- The final bounded production attempt [41368943554](https://github.com/beech80/clipt/actions/runs/41368943554) returned `MUX_PAID_MODE_UNAVAILABLE` before encoder startup. This is **not** a successful real paid-stream/playback test.
- At 00:49 UTC, automatic Supabase expiry had completed cleanup of both rejected acceptance resources: two stopped test sessions, zero unresolved sessions and healthy worker freshness.
- **Production user broadcasting remains disabled.** Mux non-test livestreaming must be activated or corrected, then a new bounded real paid-stream acceptance must pass before enabling invited OBS publishing.
- Mux spending-alert dashboard confirmation remains pending. $25/month is the approved planning target, not a provider hard cap.
- Phone Camera Live/Screen Live, native signing/physical-device acceptance and app-store publishing remain deferred. App checkout/donations remain disabled. Backblaze's download cap remains $0.

The existing web beta remains available. Do not label longer computer livestreaming launched while the provider activation gate is closed.

## Follow-up after owner-reported activation — 2026-11-02 02:34 UTC

- The owner reported completion of the Mux billing/alerts step. A fresh bounded production acceptance ran at [41377241929](https://github.com/beech80/clipt/actions/runs/41377241929), commit `f2a1f255474dd5e266a6edeba2470725d5114ded`.
- Mux again returned `test:true` with a 300-second duration despite the explicit `test:false` request. The validator returned `MUX_PAID_MODE_UNAVAILABLE` before any encoder started. Real paid ingest, private HLS decoding and webhook delivery therefore remain unverified.
- Automatic teardown completed: three total acceptance resources ended, zero unresolved sessions, healthy minute cleanup. Six conservative reserved minutes remain charged against the internal monthly allowance; no encoder minutes were streamed by these refused checks.
- PR [45](https://github.com/beech80/clipt/pull/45) merged as `a7b13888e717a012da59f7b83ad65654d408f4f6`. This permits at most four 90-second operator checks per rolling day; authenticated tester limits remain two starts/day, one concurrent broadcast and a 30-minute deadline. Validation [41376895014](https://github.com/beech80/clipt/actions/runs/41376895014) passed release, Chromium and macOS WebKit checks.
- Read-only account correlation confirms the production token belongs to the same Mux organization as the owner's known dashboard. Its environment type is production; it is separate from the earlier development dashboard environment. Video/System write permissions are valid. No account names, token names, credentials or raw identifiers are returned by diagnostics.
- Production backend version 8 includes this redacted account correlation. Code checks [41377895159](https://github.com/beech80/clipt/actions/runs/41377895159) passed 846 application tests, 12 monitoring tests, typecheck, CSS checks, build and dependency audit with zero vulnerabilities. Chromium checks passed 34 general and eight private-media scenarios.
- Operations request was restored to `reconcile` only at commit `8125765ff36adf322911194a02a127788045f4af`; its independent cleanup run [41377895408](https://github.com/beech80/clipt/actions/runs/41377895408) passed. No additional paid attempt is automatically scheduled.
- Security advisors show no ERROR; the managed `pg_net` placement warning and intentional RLS/no-browser-policy information remain unchanged.
- **Invited production broadcasting remains disabled until Mux creates a non-test resource and the real encoder/playback/webhook/shutdown test passes.** The next owner input is the actual plan label shown in Mux Organization Settings → Billing. Do not repeatedly rotate keys or retry resource creation without a new provider/configuration finding.

- Account-correlation PR [46](https://github.com/beech80/clipt/pull/46) merged as `49820ff005451fb00ae064dfe7a1bbbf5bacca1a`. Its macOS WebKit job also completed successfully; this is automated browser-engine coverage, not physical-device/native broadcasting verification.

## Explicit Pay as you go confirmation — 2026-11-02 02:49 UTC

- Owner confirmed the Billing page says Pay as you go.
- Fresh bounded check [41379289669](https://github.com/beech80/clipt/actions/runs/41379289669), source `337136654757a4380cc02091c8928aca831eafc5`, again returned `MUX_PAID_MODE_UNAVAILABLE` at 02:44:35 UTC before encoder startup.
- Re-read provider diagnostics show four owned acceptance resources, all disabled, each with test=true and max_continuous_duration=300. Database confirms zero unresolved sessions, healthy cleanup and broadcasting disabled. No encoder was started by any of these four attempts.
- The known Mux organization matches; production environment and Video/System write permissions are confirmed. The available evidence does not establish why Mux changes the explicit test=false request. Billing entitlement/activation is a provider-side hypothesis requiring confirmation, not a verified root cause.
- Operator allowance of four checks per rolling 24 hours is exhausted; no quota was raised and no additional acceptance is scheduled. Normal tester limits remain unchanged.
- Cleanup-only operation `8af57d8027d85879e2e956054c9ef2eeb730db0b` succeeded in [41379633940](https://github.com/beech80/clipt/actions/runs/41379633940).
- Prepared [credential-free Mux support details](./MUX-LIVE-ACTIVATION-SUPPORT-2026-11-01.md). These have **not** been sent to Mux. Desktop read-only fallback timed out twice, so no signed-in Billing page was independently inspected.
- Longer production OBS broadcasting remains gated until the provider mismatch is resolved and actual ingest, signed playback, verified webhook and shutdown acceptance succeeds. Web beta availability is unchanged.

## Owner-requested alternate retry and two independent reviews — 2026-11-02 03:07 UTC

- Both requested agents completed independent code/API reviews. They confirmed deployed v8 matched main; explicit test=false was a boolean, correct endpoint/JSON/auth were used, 90 seconds was documented valid, and omitted false responses were already supported. They found no concrete request/validator mistake.
- PR [47](https://github.com/beech80/clipt/pull/47), merge `f47e3af4733cc6ac5baadf11996babf53f60a193`, adds an acceptance-only alternative using pinned official `npm:@mux/ts@16.0.0`, then independently retrieves the exact resource through the original HTTP client. Normal user creation remains unchanged.
- The SDK alternative follows the official production sample by omitting test, retains signed policies/90-second duration, explicitly fixes Basic credentials and API host, disables retries/logs/redirects, and catches errors without exposing provider bodies. Existing paid-mode validation and durable cleanup remain authoritative.
- At the owner's explicit request, exactly one additional operator check was allowed: maximum five/rolling 24 hours, with two further reserved minutes. Tester limits and the 300-minute monthly allowance were not changed. The sixth operator request is rejected by executable SQL coverage.
- Validation [41380537128](https://github.com/beech80/clipt/actions/runs/41380537128) passed: 850 application tests, 12 monitoring tests, typecheck, CSS/build and zero audit vulnerabilities; Chromium regressions/private media and macOS WebKit's four conversion,22UI and three repeated-feed checks also passed.
- Official-SDK runtime attempt [41380913803](https://github.com/beech80/clipt/actions/runs/41380913803), operation commit `ebffb7ae8c18436855f0b695ae45cfdae482cd8a`, returned `MUX_PAID_MODE_UNAVAILABLE` before encoder startup. Production backend is version9.
- Exact redacted `function_logs` event at 03:03:22.761 UTC proves SDK create and independent HTTP GET both returned owned test=true/duration300/idle/signed-only shapes. This distinguishes the result from an SDK import error or custom-client/parser-only discrepancy. The exact underlying provider/account reason remains unconfirmed.
- The attempted local isolated SDK mock-wire package installation stalled and was stopped; no local mock-wire check is claimed as passed. The pinned SDK did import and run against the actual provider in Edge, and the committed adapter/security unit tests passed in CI.
- All five acceptance resources are ended; zero unresolved sessions; healthy minute cleanup; ten conservative internally reserved minutes; no encoder started in the five refused attempts. Cleanup-only run [41381083065](https://github.com/beech80/clipt/actions/runs/41381083065) passed. No additional attempt is scheduled.
- The [Mux support report](./MUX-LIVE-ACTIVATION-SUPPORT-2026-11-01.md) now contains both methods and the timestamped comparison. It has not been sent externally.
- **Longer production broadcasting remains disabled.** Correct provider non-test behavior and actual ingest/signed playback/webhook/shutdown acceptance remain necessary; neither paid streaming nor physical native broadcasting has been claimed verified. Web beta remains available.
