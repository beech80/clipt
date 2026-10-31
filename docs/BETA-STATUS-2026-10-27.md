> Historical snapshot from October 27. Later backup, private-media, provider-support and cleanup results supersede pending items below. See [the October 31 release review](BETA-RELEASE-REVIEW-2026-10-31.md) and [current launch checklist](LAUNCH_CHECKLIST.md) for current production status and outstanding approvals.

# CLIPT beta status — October 27, 2026

Payments remain disabled. This is a free, explicitly invited web beta. Domain/DNS and native/App Store work remain deferred by owner choice. This record distinguishes automated/backend evidence from real signed-in/device acceptance.

## Completed and verified

- Production app/API invitation enforcement is active for the sole approved owner. Privacy/terms are approved.
- In-app alerts and owner-confirmed external email delivery were previously verified. The independent monitor is retained; GitHub schedules are best-effort.
- Media snapshot `20261027-beta-initial`: all **141 files / 942,701,900 bytes** copied to the approved private Backblaze bucket and fully restored with matching SHA-256 hashes. See MEDIA-BACKUP-VERIFIED-2026-10-27.md.
- **Private-media cutover is complete:** all **6 source buckets private**, **51 verified legacy paths supported**, both ownerless files preserved and restricted. The ownerless files are referenced by zero posts.
- Actual cutover run https://github.com/beech80/clipt/actions/runs/40618038518 denied anonymous access to all 141 public-object probes and passed four service-authorized signed-media samples. Independent GET/HEAD probes of six original URLs also failed closed. Original object records and byte counts are unchanged. The temporary privileged operator is retired (HTTP 410). See PRIVATE-MEDIA-CUTOVER-VERIFIED-2026-10-27.md.
- **Dependency finding resolved:** removed unused PWA tooling and its vulnerable deepmerge chain, with no forced downgrade or audit exclusion. See DEPENDENCY-SECURITY-CLOSURE-2026-10-27.md.
- Main validation https://github.com/beech80/clipt/actions/runs/40618038499 passed **710 unit tests, 12 monitor tests, 3 Chromium fixtures, typechecks, zero-vulnerability audit, CSS checks and production build**. Separate cutover/backup operation suite passed **96 tests**.
- Prior independent development acceptance passed 49 SQL assertions and 41 signed-in HTTP checks; prior production Edge checks denied 16 anonymous calls. These do not replace current signed-in production/device acceptance.

## Still required for beta readiness

1. **Supabase provider work:** ticket **SU-526512** is acknowledged; pg_net repair guidance is pending. Current security advisors have no ERROR groups and one pg_net extension-placement WARN. Patches, Pro and leaked-password protection were previously verified. Do not attempt unsupported extension relocation or weaken privileges to silence the warning. Remediation: https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public .
2. **Signed-in production and physical-device acceptance:** verify approved sign-in, uninvited/revoked denial, video playback and URL renewal after cutover, uploads, comments, Trophies, messaging/Realtime, recovery/email redirects, and account deletion using an intentionally disposable test account. Check iPhone Safari and Android portrait/landscape, zoom, keyboard and gestures. No real-device pass or normal owner-session HTTP pass is claimed by the service-authorized media probes.
3. **Ongoing private-media backup coverage:** the existing backup/restore is a verified frozen snapshot, not a schedule. A reviewed private-source backup read path and recurring schedule are still needed for future uploads. Supabase database backups alone do not back up Storage media bytes.

The two ownerless files await ownership review but are safely retained and inaccessible to normal users; they do not justify guessing an owner or publishing them. No published post references them.

Automatic Git deployments and both historical web deploy workflows remain held. The live Vercel UI deployment is unchanged. The owner-authorized backend read boundary and Storage API privacy changes above are active. No payment setting, billing activation or controller layout was changed.

The earlier source reconciliation and exact archive provenance remain recorded in SOURCE-RECONCILIATION-2026-10-27.md and RELEASE-SOURCE-PROVENANCE-2026-10-27.json. Later backup/cutover/security commits and receipts supplement that historical baseline.
