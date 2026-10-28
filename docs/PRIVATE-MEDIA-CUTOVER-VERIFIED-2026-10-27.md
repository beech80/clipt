# Private-media cutover verified — October 27, 2026

## Completed in production

All six buckets in project `slnjliheyiiummxhrgmk` are private. Visibility was changed through the Storage API; no Storage object metadata, file bytes, paths or owner assignments were rewritten.

The verified backup remains snapshot `20261027-beta-initial`: 141 files / 942,701,900 bytes, independently fully restored with SHA-256 comparisons. The cutover job fetched and verified its private manifest and completion receipt before proceeding.

Production migration `20261028013909_prepare_production_private_media_compatibility` adds the previously tested restrictive invoker read boundary and an exact-identity compatibility registry. The registry contains **51** legacy paths with consistent recorded owners. Its contents have RLS and no direct client grants; the narrow comparison helper requires a signed-in, approved beta identity, verifies immutable object identity and current ownership, and grants no file download itself. Existing post visibility, moderation, blocking, membership and enrolled-MFA boundaries still intersect the media read rule.

Both ownerless files remain stored and backed up, but ordinary users cannot sign/read them. They are referenced by **zero posts**, including zero published posts. No owner was guessed; owner review remains available without blocking other content.

## Verification

- Actual Storage API cutover: https://github.com/beech80/clipt/actions/runs/40618038518 .
- Completed receipt: **6 private buckets**, **141 anonymous public-object HEAD probes denied**, **4 service-authorized signed-media samples passed**.
- Independent requests against six original, unmodified public URLs (one per nonempty bucket plus both ownerless objects) returned HTTP **400** for both GET and HEAD.
- A fresh full inventory matches the pre-backup object records exactly except bucket visibility: same 141 IDs, paths, owner IDs, versions, timestamps, metadata and 942,701,900 bytes.
- Approved-account SQL role tests read eligible content; anonymous and uninvited roles read zero objects; ownerless objects are excluded. These simulated SQL claims are not real browser sessions.
- The deployed JavaScript already contains the signed-media hook, response-boundary verification and legacy-path parser. Shared avatars, discovery/search, post content, profile tiles and draft previews use that signing path. No frontend publication or controller redesign was required.
- Full source validation: https://github.com/beech80/clipt/actions/runs/40618038499 : 710 unit tests, 12 monitor tests, 3 Chromium fixtures, typechecks, security audit, CSS and production build passed.
- Separate operation suite: **96 tests passed**, including 25 GitHub OIDC cases and the existing backup tests. Seven additional server-operation tests exercise denied credentials, fixed Storage API calls, service-signed sample checks and rollback.

## Temporary operator retired

The Storage API administrator key stayed inside Supabase. A short-lived operator verified GitHub RS256/JWKS identity, exact repository/owner IDs, main branch, event, workflow, audience, expiry and one reviewed request commit before loading any administrative credential.

The exact authorized request commit is `8d736a24e2c70d5ac1e282df166ae5c9056c42ce`. The operator was then replaced with a credential-free HTTP **410** handler (deployed version 2), and retirement was verified by a fresh request. The checked-in implementation is inert by default with a disabled SHA and zero deadline. Rerunning the old request cannot re-enable it.

The operation had a tested rollback to the prior flags if Storage API checks or subsequent public-access probes failed. No rollback was required. Future recovery needs a new reviewed operation, not a live general-purpose administrator endpoint.

Reviews: https://github.com/beech80/clipt/pull/13 . The exact production DDL is recorded in `supabase/release/20261028013909_prepare_production_private_media_compatibility.sql`; its timestamp is Supabase's generated UTC migration version. It is production-specific release evidence, not a migration to replay blindly into development.

## Limits and next checks

Normal owner-session HTTP playback, fresh uploads, expiring URL renewal and real iPhone/Android acceptance still require signed-in testing. The four privileged signing probes confirm Storage API/bucket functionality and byte availability; they do not prove every user's authorization or physical-device behavior.

Signed URLs remain bearer links until expiry. Previously public or downloaded copies cannot be recalled by changing bucket settings. Current cache-miss probes and the original URLs tested are denied; this is not a claim that all historical copies have disappeared.

The existing media backup is a verified one-time snapshot. Its old source reader intentionally uses public GETs and now fails closed against private buckets. New private uploads require a separately authorized recurring backup read path and schedule; neither a recurring backup nor recovery point coverage for future uploads is claimed here. Database backups remain a separate service and do not contain Storage media bytes.

Source: https://supabase.com/docs/guides/storage/schema/design . No files were copied/moved or simulated by SQL metadata edits.
