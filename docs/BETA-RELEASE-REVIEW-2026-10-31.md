> Update November1: the owner approved the final production steps. The migration, catalog deployment and production web publication below have now succeeded. See [the actual rollout receipt](WEB-BETA-ROLLOUT-2026-11-01.md) for deployed source, checks and remaining signed-in acceptance. The text below preserves the pre-release review; its pending-approval/publication statements are historical.

# CLIPT beta release review — October 31, 2026

This report distinguishes observed production state from a tested release candidate. The owner has accepted the current interface and reports testing web messaging and the other phone flows. That report is user acceptance, not an independent automated or native-device pass. Production publication still requires the owner's explicit approval.

## Verified operational gates

- Production Supabase slnjliheyiiummxhrgmk is ACTIVE_HEALTHY on Postgres 17.11.0.003. The security advisor reports zero ERROR findings. Its managed pg_net placement warning remains documented, not suppressed or repaired by unsupported grants. Provider clarification is recorded in the pg_net security review; keep net, Vault and private schemas outside the Data API, without exposed forwarding functions or untrusted database login roles. Development has a separate leaked-password-protection warning; production and development are not interchangeable.
- Invite-only admission is active: one approved member, the confirmed beecher@cliptgaming.com account, with moderator access. Other existing accounts are not implicitly approved.
- All six production storage buckets are private. The current snapshot has 141 objects, 942701900 bytes, 51 supported legacy paths and two preserved ownerless objects. No ownerless deletion is authorized by this review.
- [Recurring media backup and independent restore](https://github.com/beech80/clipt/actions/runs/41189682314) passed on October 31: all 141 files and 942701900 bytes matched; backupCompleted and restoreCompleted were true. Snapshot 20261031-41189682314-1; manifest SHA256 dd90aba620f5f6fd8dccfadd497dd37dca4cb941621e1a2bfe4d06ce58b4e98e. Production files and bucket privacy were unchanged. Database backups do not include these media bytes.
- [Production monitoring](https://github.com/beech80/clipt/actions/runs/41211553953) passed all six public probes: login, privacy, terms, Auth health, closed anonymous beta admission and unauthorized data denial. The owner previously confirmed receiving the real GitHub email alert. A later local Windows retry timed out on login while the other five probes passed on retry; it is not a complete local monitoring pass or proof of a service outage.
- [Automatic native reconciliation](https://github.com/beech80/clipt/actions/runs/41226669924) passed at 12:53 PM Chicago: checked 0, stopped 0, pending 0, ok true. This closes the earlier schedule-observation gate. It does not prove actual expired-provider teardown with a live native stream. GitHub schedules are best effort.
- Production browser flags require beta access and disable checkout; the server donation endpoint rejects production payments and checkout uses the development-only test guard. No paid billing or paid production Mux access was enabled.

## Missing production contracts found and tested

The reviewed client expects creator mutes, restrictive Squad visibility/capabilities, game-channel columns and views, verified catalog import and stream announcements. Production lacks these contracts. In particular, the feed waits for its mute query and fails closed when user_mutes is absent. Publishing the new client before the backend rollout could therefore leave the feed empty.

[PR 35](https://github.com/beech80/clipt/pull/35), head e4f80c2afc4467c7278fea201aec80cd84f04a2f, stages supabase/release/beta-feature-compatibility.sql and production-like SQL tests. The SQL is a single transaction with bounded lock/statement timeouts and strict prerequisite checks. It preserves existing post/game identities and private media; adds invitation boundaries to new owner-private tables; registers erasure; retains stream-secret column restrictions; and installs the restrictive Squad visibility rule. Catalog writes remain service-only.

Photo channels honor photo_review_held when that optional pipeline exists. A partially installed pipeline aborts. Where no pipeline exists, the view retains existing manual-moderation/post RLS. This does not install, enable or certify the development Azure review pipeline.

[CI 41231194331](https://github.com/beech80/clipt/actions/runs/41231194331) passed all three jobs for the exact head: 820 app tests, 12 monitor tests, typecheck, CSS checks, web build, zero-vulnerability npm audit, Chromium and WebKit. The SQL tests cover owner/follower/outsider/blocked/uninvited identities, mute privacy, announcements, erasure, service-only catalog imports, held-photo exclusion and atomic refusal when safeguards are incomplete. The redundant slow local SQL run was cancelled after the cloud suite passed; it is not reported as a complete local pass.

A separate Vercel preview was built READY from this exact head, with branch-scoped public production app configuration, required invitations and disabled checkout. The production alias is unchanged. The preview is a release review candidate, not a working production replacement until the database contracts are installed. Protected HTTP verification of this new preview was unavailable through the current Vercel fetch connection; no signed-in hosted smoke pass is claimed.

## Proposed production rollout and verification

Only after explicit approval:

1. Merge the tested source and freeze its commit. Recheck existing production invariants: 22 games, game identity hash 1a62e24c172f4a13c2af238c17cff57e; 12 posts, post/game identity hash 2390ec3253f64c59ad1abf98d56062de; six private buckets and 141 unchanged media objects. Concurrent legitimate content changes require a fresh baseline, not data rollback.
2. Apply the reviewed compatibility SQL once through a tracked migration. Abort on partial contracts or failed safeguards; inspect before retrying. Do not clone development wholesale or enable Azure, payments or native publishing in production.
3. Deploy the reviewed, authenticated existing game-catalog function with its reviewed dependencies. Verify service-only catalog writes and unauthorized denial. Keep signing/provider keys server-side.
4. Build the pinned frontend with production configuration, then publish the approved release and check login, legal routes, invitation denial, feed/catalog contract availability and payment guards. A Vercel promotion may rebuild with production variables; do not assume a preview artifact is promoted unchanged. Do not promote a development-configured preview.
5. Run a signed-in smoke test with the approved owner when that session is available. Record any browser or device limitation. Keep independent monitoring active and verify private media and existing content identities remain unchanged.

Rollback: restore the previous production frontend if smoke checks fail. The transactional SQL rolls back on an apply error. After successful use of new tables, preserve user data and restrictive privacy policies; fix forward rather than dropping new records or weakening Squad/invitation controls. Keep media backups and existing private storage unchanged. Do not delete or rewrite existing game/post identities to make tests pass.

## Streaming scope and deferred native acceptance

The observed OBS success was a bounded development-owner test, not general production streaming. The owner saw moving playback on a phone for about a minute; the slow computer experienced encoder/network instability and the test resource was subsequently disabled. Production has no current stream records or complete general-production Mux provisioning path. A decision to allow invited testers to broadcast needs a separate production Mux configuration, usage budget and longer end-to-end test. Neither the successful pilot nor a Supabase Pro upgrade supplies that authorization.

Native Camera Live and Screen Live are implemented and their Android/iOS builds passed. Development configuration guards pass and recurring cleanup is now observed. Real signed provider delivery, matching private HLS playback, physical capture/audio, interruption and full provider teardown remain unverified. The owner deferred the Mac/Xcode installation and physical phone tests. See [the iPhone handoff](NATIVE-IPHONE-FIRST-TEST-2026-10-31.md); its current artifact expires November 6 at 1:01 PM Chicago. A fresh artifact is required after expiry.

## Release status

Prepared and tested, not yet published: production compatibility migration, catalog deployment and reviewed frontend release. Pending decisions/acceptance: explicit production approval, web-beta streaming scope, signed-in hosted smoke verification, and native physical acceptance when the Mac is ready. Domain/DNS and App Store publication remain deferred. No full legal, accessibility, store, load-capacity or zero-defect certification is claimed.

Support and moderation owner: beecher@cliptgaming.com. Existing privacy/terms were approved by the owner and publicly served by the monitor. This report does not replace legal review or assert GDPR/CCPA certification.
