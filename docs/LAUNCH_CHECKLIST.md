# CLIPT web beta launch checklist

Updated November 2, 2026. The [final photo and operations acceptance receipt](WEB-BETA-ACCEPTANCE-2026-11-02.md) records the current closure evidence; older dated checks below remain historical. The approved web release is published; see [the rollout receipt](WEB-BETA-ROLLOUT-2026-11-01.md). Use the [current release review](BETA-RELEASE-REVIEW-2026-10-31.md) for evidence, rollout order, invariants and rollback instructions. This checklist records verified results; it is not a legal, store or zero-defect certification.

## November 2 final web-beta acceptance

- [x] The owner posted a real photo through CLIPT. The worker scanned the private JPEG and its caption, recorded no_flag_detected after two operations, completed the job and released the post with no unresolved quarantine. The owner explicitly confirmed the actual picture displays.
- [x] The owner opened the production “Photo and caption review” section and confirmed “No photo posts require review,” the expected result for this clean photo. No live flagged-photo decision or agent-controlled signed-in browser session is claimed.
- [x] Production Azure is enabled for eligible public photo posts/captions; the moderator authenticator is verified. Synthetic provider verification and the first enabled tick succeeded. Videos remain manually moderated; free-tier bounds and private media protections remain in place.
- [x] CI41502935870 passed 903 app tests,12 monitor tests,type/CSS/build/audit0,53 Chromium UI+8 private-media checks,and WebKit4 codec+41 UI+3 repeated-playback checks.
- [x] The latest production-monitor rerun passed all six probes first attempt at19:11 UTC and recorded recovery; incident50 is closed. The November2 backup/restore verified142 files/948205598bytes. Its receipt supersedes the November1 deferred-snapshot note.
- [x] Within the approved free, invite-only web scope, the remaining planned acceptance check is complete. Keep operational monitoring, backups and moderation running. Explicitly deferred work below is not a new web-beta launch gate.

## Verified

- [x] Invite-only access is active; the confirmed beecher@cliptgaming.com account is approved and has moderator access. Existing accounts are not automatically admitted.
- [x] Production database is healthy and patched to Postgres 17.11.0.003; security advisor has no ERROR findings. The managed pg_net placement warning is documented under the provider-supported boundary.
- [x] All six media buckets are private; 51 legacy paths are supported and two ownerless objects are preserved.
- [x] The October 31 recurring media backup and independent restore verified all 141 files and 942701900 bytes without modifying production files. Database backups are separate from media backups.
- [x] Production availability/security probes passed in the cloud. External GitHub alert email delivery was confirmed by the owner.
- [x] Production checkout and donation payments remain disabled for the free beta.
- [x] Owner-approved privacy and terms routes are publicly available according to the monitoring run. This does not establish legal compliance certification.
- [x] The owner reports completing phone/UI/messaging acceptance for the existing web experience.
- [x] The staged compatibility release passed 820 app tests, 12 monitor tests, type/CSS/build/audit checks and Chromium/WebKit regressions.
- [x] Development native cleanup has an observed successful automatic invocation. Native builds passed; physical broadcasts have not passed acceptance.

## Production rollout and final acceptance

- [x] Owner approved the final production steps; PR35 merged as8c301c9fdabbed95dbc30c5ee34b978193c26b60.
- [x] Applied tracked migration20261031194900; content/media hashes, invitation/RLS boundaries, erasure registration and stream-secret restrictions were verified.
- [x] Catalog version1 deployed/read back; production deployment dpl_A4AxYytdYJFutv37ogBi7SZanjFq is READY with verified active production configuration. Payments and general broadcasting remain closed.
- [x] Public login/privacy/terms, Auth health, beta admission denial, unauthorized data denial and deployed asset configuration passed. November1 scheduled monitoring and backup/restore passed.
- [x] Owner confirmed password recovery, sign-in, a real upload/playback and prior phone/messaging/UI acceptance. PR37 fixes the two newly reported game-selection and portrait swipe-position defects with Chromium/WebKit coverage. A fresh owner iPhone check of this latest revision remains recommended; no automated signed-in hosted pass is claimed.
- [x] Owner explicitly chose “Launch web beta; defer broadcasting” on November1. Production broadcasting stays disabled; Go Live explains the deferral and links to video/photo posting. Development OBS pilot and later native acceptance remain separate.

## Separate deferred work

- [ ] Mac/Xcode signing and physical iPhone/Android Camera Live / Screen Live acceptance, real signed webhook/private playback and end-to-end teardown.
- [ ] Domain/DNS connection, at the owner's chosen later time.
- [ ] App Store/TestFlight/Google Play publication and their applicable policy/device reviews.
- [ ] Any claim of comprehensive accessibility, legal, peak-load or store compliance requires its own evidence; it is not marked complete here.

Support and moderation contact: beecher@cliptgaming.com. Operational alerts use the verified owner destination. Keep independent monitoring and private media backups active after release. No on-call rotation, cookie compliance certification or unperformed load test is implied.

## Latest two owner-reported fixes

- [x] PR37 is merged as22645637ea527b3cb0ab706970212713a65151f0; production dpl_5ULTMt5LYXvAHC2H35fk7cKGFW2w is READY at the existing stable address. Game catalog version2 was deployed/read back; both real provider health probes succeeded and anonymous mutation stays401.
- [x] New Post automatically searches the paginated full provider catalog while typing and retains the verified game selection. Overwatch2016 was independently verified and imported; catalog coverage is not guaranteed to include every title.
- [x] Portrait CLIPT/swipe positioning uses current visual viewport dimensions and its actual responsive height, below the reserved video area. Both hand layouts and landscape controls passed regression checks and screenshot review.
- [x] CI41325592048 passed823 app +12 monitor tests, type/CSS/build/audit0,32+8 Chromium and4+20+3 WebKit checks. Merged-source CI41326425373 also passed after one targeted WebKit retry: the first HEVC preview-enable assertion timed out, then passed unchanged. Keep that observed intermittency visible; physical Safari testing was not performed by the agent.

## Current release and fresh backup follow-up

- [x] Owner approved web-only beta launch with broadcasting deferred. Production Go Live explains this; recorded videos/photos remain available.
- [x] PR38 (5955aba3d4d0bc1ab54cb6a16f0e41f679f7500e) centers CLIPT on roomy computer/tablet feeds and balances portrait-tablet swipe gutters. Phone layouts remain covered by existing tests.
- [x] PR41 adds clearance below the wide landscape player so the centered button does not intersect native seek controls. Production dpl_EiWGKfgCb4jGnAUoLRNdfCj91q75 is READY from9e697e77110dfa404bb96d1aaa1b3c6ccf276f2b.
- [x] CI41332357505 passed825 app tests,12 monitor tests, type/CSS/build/audit0,34 Chromium UI+8 private-media and WebKit4 codec+22 UI+3 repeated-feed checks. Centered geometry, player clearance, both hands, menu/focus and player identity are verified at1280x800,1024x768 and768x1024.
- [x] Fresh independent production monitor (run41316337185, latest job124918571053) passed all probes. Production project is ACTIVE_HEALTHY on17.11.0.003. Security advisor has zero ERROR findings and no leaked-password warning; the managed pg_net placement warning remains documented.
- [x] Current production inventory:142 objects,948205598 bytes,six private buckets,zero public buckets,23 configured game entries including verified Overwatch2016. Content was preserved.
- [x] Owner retained the$0 Backblaze download cap, superseding the earlier$0.10 approval. No cap or billing setting was changed. The November2 run41434994559 subsequently completed the backup and independent restore for all142 files/948205598bytes, with two ownerless files preserved and production unchanged. This supersedes the November1 cap-blocked verification note. New uploads follow the existing backup schedule; do not claim a snapshot includes future uploads.
- [x] PR40 adds bounded, redacted backup diagnostics and updates exact source attestation. Production private-media-backup version2 was read back and matched reviewed files. Offline backup/security suite passed131 tests; download error bodies, private URLs and credentials are not logged.
