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
- [ ] Complete the final approved signed-in production upload/playback/comments/profile smoke check. Browser connectors were unavailable; Windows helper initialization timed out. Read-only RLS simulation passed, but is not a browser pass.
- [ ] Resolve web-beta streaming scope explicitly: the OBS proof is a development-owner pilot, not general production Mux readiness. Do not advertise unrestricted live broadcasting until separately configured, authorized and tested.

## Separate deferred work

- [ ] Mac/Xcode signing and physical iPhone/Android Camera Live / Screen Live acceptance, real signed webhook/private playback and end-to-end teardown.
- [ ] Domain/DNS connection, at the owner's chosen later time.
- [ ] App Store/TestFlight/Google Play publication and their applicable policy/device reviews.
- [ ] Any claim of comprehensive accessibility, legal, peak-load or store compliance requires its own evidence; it is not marked complete here.

Support and moderation contact: beecher@cliptgaming.com. Operational alerts use the verified owner destination. Keep independent monitoring and private media backups active after release. No on-call rotation, cookie compliance certification or unperformed load test is implied.
