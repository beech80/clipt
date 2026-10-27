# CLIPT beta status — October 27, 2026

Payments remain disabled. Domain work is deferred. This is bounded release evidence, not certification of every feature/device.

## Verified

- Production is deployed at https://clipttest-matthew-beechers-projects.vercel.app with app/API invitations enforced for the sole approved owner.
- Privacy/terms are approved and public route smoke checks passed.
- Prior backend acceptance passed 49 development SQL assertions, 41 signed-in development HTTP checks and 16 anonymous production Edge denials.
- In-app alerts and owner-confirmed external email delivery are verified. Automatic monitor run 40468721763 passed all six live probes and correctly sent no duplicate alert. GitHub schedules remain best-effort.
- Source reconciliation is tracked in https://github.com/beech80/clipt/pull/6 . Candidate 0c773af497242b4cc25d98e0cae8eddf75a00dc1 passed 702 unit tests, 12 monitor tests, typechecks, audit (zero vulnerabilities), CSS and build.
- All three local-only Chromium posting/message fixtures passed, including message layouts at 320/390/1440 CSS pixels. Run: https://github.com/beech80/clipt/actions/runs/40509688736 .
- Fixture fixes target unique safety alerts, restore collapsed controls through Show controls, and verify disabled submits and both Back actions. Original cleanup, duplicate-posting, request-count, retry, read-state and layout assertions remain. No app behavior was changed by those fixes.

## Still open

1. Supabase Pro request SU-526512 is acknowledged; pg_net repair guidance remains pending. The earlier reference is SU-521682. Patches, Pro and leaked-password protection were previously verified.
2. Verified media backup/restore and compatibility-safe private-media cutover remain unfinished: 51 legacy paths and two ownerless objects need migration/review; five buckets remain public. Do not change flags or claim complete media confidentiality without the recovery prerequisite.
3. Physical iPhone/Android zoom, keyboard, gestures and playback acceptance remain. Local mocked Chromium tests are not device or production-user tests.
4. Remaining signed-in production, Realtime, email/recovery redirects and live workflows need acceptance. Native/App Store release is outside this web-beta phase.

Automatic Git deployments and both old deploy workflows remain held. The independent monitor is preserved. This reconciliation applies no database migration, media permission, payment or production deployment change. Exact source provenance is recorded in SOURCE-RECONCILIATION-2026-10-27.md and RELEASE-SOURCE-PROVENANCE-2026-10-27.json.
