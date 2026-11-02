# Production Azure photo/caption rollout

Scope approved by owner: photos and captions; videos remain under reports and human moderation. The Azure resource is owner-confirmed Free/F0. Do not claim video, audio, chat, avatar, or private/subscriber-only content is scanned.

Install `database/production_azure_photo_rollout.sql` only after source tests pass. All activation settings default off. Deploy `azure-photo-worker` and `production-photo-preview` with their reviewed dependencies. They authenticate GitHub OIDC and account/MFA/role respectively; gateway JWT verification is disabled only because each handler validates its own appropriate credential.

The worker runs on the main-only GitHub workflow, validates signature, audience, repository IDs, immutable workflow/runner hashes and short-lived hosted-runner claims. No Azure or source-service secret is stored in GitHub, Vercel or the browser. No pg_net, HTTP extension or Vault transport is required.

Set production Supabase secrets `AZURE_CONTENT_SAFETY_ENDPOINT` and `AZURE_CONTENT_SAFETY_KEY` from the approved resource. Confirm Free/F0 before setting `verified_free_tier` in the private settings. Run the synthetic-only probe. Every probe consumes quota, is unique to its run/attempt, and has a five-probe daily limit.

Activation requires a verified authenticator on a server-assigned moderator account, a successful provider probe, the deployed moderation queue/creator notices, and reviewed tests. Turn on the private `enabled` setting only after those gates pass. Keep it off if any gate is missing. There are no existing published posts to backfill at audit time.

Bounds: 100 total provider operations/day, 1,000/month, 10/user/day; every attempted scan consumes a reservation and deletion does not refund it. An album can contain up to 10 photos; each image and its caption is analyzed separately. Unsupported or larger-than-4-MB images are held for manual review; no clean result is invented. Five-minute GitHub schedules are best-effort. The worker processes at most one server-selected post per invocation.

Publication and private-media access intersect existing RLS. Unknown, failed or quota-limited versions stay held and visible to their owner. Flagged or failed scans are quarantined; the protected MFA moderator preview includes every photo. Human decisions have their own audit and never rewrite an Azure result as clean. Interrupted claims older than 20 minutes are reconciled to failed/quarantined. New content versions require new review, and referenced object bytes cannot be overwritten to bypass a scan.

The frontend provides photo status, appeals, and the production moderation queue. Staff must inspect every protected photo before confirming a decision. Videos remain report/moderator handled. No automatic account bans or media deletion.

Before activation verify: known clean synthetic provider response; flagged/failed path and full album behavior; owner/other-user/staff/MFA access boundaries; queued/quota manual decisions; stale claim reconciliation; immutable bytes; existing auth, feed, upload and erasure checks. Record actual results and remaining owner steps separately; do not mark active based on deployed code alone.

Rollback: set `clipt_private.azure_dispatch_settings.enabled=false` to stop new automatic dispatch. Keep the queue and existing holds so unreviewed versions are not silently approved. Resolve remaining holds through the protected moderator queue. Preserve jobs/decisions for audit; do not drop tables or make media public.
