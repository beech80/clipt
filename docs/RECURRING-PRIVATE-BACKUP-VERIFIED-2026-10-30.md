# Private production-media backup verified — October 30, 2026 UTC

## Completed operation

- Approved destination: private Backblaze bucket `clipt-media-backup2026`, region `us-east-005`.
- Production project: `slnjliheyiiummxhrgmk`. Development/preview storage is separate and excluded.
- [Reviewed source PR27](https://github.com/beech80/clipt/pull/27), merged commit `bdd51be09abb68faea28551354f8037db812f665`.
- [Actual private copy and restore run](https://github.com/beech80/clipt/actions/runs/41008322940) passed. Backup, offline tests and reporter all succeeded.
- Snapshot: `20261030-41008322940-1`. All 141 source records were copied and restored, 942,701,900 bytes each way, with SHA-256 checks after independent private reads and isolated temporary-file writes/readbacks.
- Both ownerless files were preserved. Private manifest and receipt were independently read back successfully; no private inventories, media, URLs or credentials were published as artifacts.
- Manifest SHA-256: `14fb0f9c669bf882fac676d2a8b2b457d4bec089995319ec8b0a77363dd70692`.
- Final production metadata check: six private buckets, zero public buckets, 141 objects, 942,701,900 bytes, two ownerless files, zero versioned/archived/delete-marker objects. No production media/ownership/privacy mutation occurred.
- Recurring workflow is active: daily at 03:17 UTC, with manual dispatch available in Actions. GitHub schedules are best-effort.
- Reporter returned `healthy`. Failures create one deduplicated issue assigned to beech80 through the previously verified owner email route; healthy runs stay quiet. Recovery closes only the reporter's own tagged incident.

## Validation

[Current reviewed source checks](https://github.com/beech80/clipt/actions/runs/41007579684): 748 unit/integration, 12 monitor, 31 Chromium and 18 WebKit tests passed, alongside typecheck, security, CSS and production build checks. [Backup checks](https://github.com/beech80/clipt/actions/runs/41007579601): all 129 passed.

An earlier WebKit run found a null bounding box while an existing panel fixture was mounting. The fixture now waits for visible, correctly sized controls before measuring; expected dimensions and behavior remain asserted. Application layout code was unchanged.

Production worker unauthenticated POST returns 401; GET returns 405. Both service-only metadata RPCs deny browser access, use security invoker and grant execute only to service_role. Applied migration version: `20261030045125`. Administrative source credentials remain inside Supabase. The worker independently validates short-lived GitHub OIDC and exact reviewed source hashes; it never uses pg_net or Vault request queues.

## Recovery and operating bounds

The complete restore was performed into isolated temporary files, not over production. In a disaster, preserve the chosen private run manifest/receipt, recover the matching database backup through Supabase, and use the manifest's exact source bucket/path/ownership metadata and hashed content references for an explicitly approved staging recovery. Verify every size/hash and access rule before any production restore. Never make buckets public to recover content.

Limits: 1,000 objects, 5 GB/snapshot, 100 MB/object, 45-minute job. Unexpected source buckets/data, public sources, changed source identities, archive/version markers, over-limit snapshots and integrity failures stop without a success receipt. Review alerts and increase bounds only after capacity/testing review. No source deletion or privacy change is part of this job.

Immutable content is deduplicated across snapshots, but each run downloads all source bytes and verifies a full restore; provider egress applies. Historical content/snapshots are not automatically pruned. No destination plan or retention/deletion rule was changed. This is a media backup alongside Supabase database backups, not a replacement for them.

## Supabase pg_net and owner acceptance

[Provider guidance and verified containment](SUPABASE-PG-NET-REVIEW-2026-10-30.md) close the attempted unsupported-grant repair path. The managed pg_net placement warning remains; no claim is made that it was removed. The actual Data API rejects net, vault and clipt_private; no ordinary exposed app RPC forwarding network/Vault data was found. Credentials passed through pg_net remain visible to trusted LOGIN roles under the provider's documented design.

The owner reports: "I like the layout of the app and I've tested everything on my own and it looks good." This is owner-reported acceptance, with no invented device/assistive-technology matrix. This change publishes no frontend release and changes no application layout. A production frontend release remains a separate approval gate; payments stay disabled and domain/App Store work stays deferred.
