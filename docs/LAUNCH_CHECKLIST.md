# CLIPT web beta launch checklist

Updated November 1, 2026. The approved web release is published; see [the rollout receipt](WEB-BETA-ROLLOUT-2026-11-01.md). Use the [current release review](BETA-RELEASE-REVIEW-2026-10-31.md) for evidence, rollout order, invariants and rollback instructions. This checklist records verified results; it is not a legal, store or zero-defect certification.

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
- [ ] Resolve web-beta streaming scope explicitly: the OBS proof is a development-owner pilot, not general production Mux readiness. Do not advertise unrestricted live broadcasting until separately configured, authorized and tested.

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
