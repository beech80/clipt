# Reviewed release source reconciliation — October 27, 2026

GitHub main's legacy CommentsPage imported missing src/lib/api/posts. Production
was built from a separately reviewed archive containing the completed CommentsPage
and related application changes. An isolated source reconciliation now restores
that reviewed snapshot instead of inventing a replacement API for stale code.

Base main commit: c6c40f9ce70785d6888bb2908704a5fa88ab495f.
Reviewed archive SHA1: 26cbcb67577c66ea590b295c6709901b215d9c9b (4,078,731 bytes).
Archive: outputs/production-rollout-reviewed.tgz, previously built with 701 passing
unit tests, typechecks, dependency audit, CSS and Vite validation. That historical
evidence is provenance, not a substitute for the new branch's CI results.

Only archive files and explicitly recorded post-release overlays are included.
UTF-8 CRLF line endings are normalized to LF; binary bytes are unchanged. The
existing working directory's unrelated edits, credentials, environment files,
outputs, browser state and node_modules are not copied. The archive was checked
for forbidden paths, service-role JWTs and private-key/secret patterns; no finding.
The companion JSON manifest records source hashes and overlay provenance.

Post-release overlays: the deployed Data API admission guard and its existing
focused unit test; existing local-only Playwright config; safe development env
example and ignore rules; and the reviewed-source CI workflow. Current main's
monitor, manual deployment holds and vercel.json protections are retained. No
app behavior is redesigned, database migration applied, or production deployment
performed by this source reconciliation.

CI runs locked installation, both typechecks, unit and monitoring tests, dependency
audit, CSS checks and Vite build. A separate Chromium job runs the three archived
posting/message fixtures against localhost mocks, with all other origins blocked
by those fixtures. It cannot use a customer's account or hosted project. No
production secret is supplied. Physical-device and live signed-in acceptance
remain separate gates. The full unrelated browser suite is not claimed here.

Validation: PENDING the isolated branch's actual CI run. Do not claim passing
checks or merge this restoration until its results are reviewed.

Supabase's current Pro support acknowledgment is SU-526512 (owner supplied). It
confirms receipt only; pg_net repair guidance remains pending. Backup/private-media
cutover and real-device acceptance remain open. Domain work remains deferred and
payments remain disabled.

First CI run 40504070133: release checks passed. Chromium installed and the 403
posting case passed. The 503 case stopped on a strict selector matching two
legitimate safety alerts; message-history did not run due to max-failures=1. The
fixture now selects publishing/duplicate alerts by message and retains all original
content, cleanup, request-count and duplicate-prevention checks. A new run is
required before claiming browser acceptance. No application code was changed.

Second CI run 40505206645: all release checks passed again. The 403 posting
case passed. The 503 fixture reached the expected safety state but tried to use
a collapsed controller. Its captured accessibility snapshot exposes Show controls.
The fixture now uses that public recovery action before navigation, retains the
duplicate-blocking assertion and additionally verifies no second post/upload or
cleanup occurred. No timeouts or application behavior were changed.
