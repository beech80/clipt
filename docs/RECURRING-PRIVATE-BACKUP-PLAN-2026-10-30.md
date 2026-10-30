# Recurring private-media backup plan — October 30, 2026 UTC

Owner authorization: "do the back up". Existing approved destination remains the private clipt-media-backup2026 Backblaze bucket in us-east-005. The owner also reports testing everything and approves the current layout. This work changes no application layout and publishes no frontend release.

## Planned operation

- Daily GitHub schedule at 03:17 UTC, manual dispatch, and an explicit reviewed main-branch request file for the initial run.
- Verify the exact private destination and existing bucket-restricted credentials before requesting private source data.
- Authorize only GitHub-hosted jobs from repository ID 917757980, owner ID 195324952, the exact main-branch backup workflow, supported events and a valid short-lived RS256 GitHub token.
- Verify the SHA-256 of the workflow at its immutable definition commit and executed dependencies at their exact checkout commit. Ordinary unrelated app commits remain compatible; unreviewed backup code fails closed.
- Inventory the six approved private production buckets using service-only invoker functions. Sign each unchanged object just before download. No public bucket, owner, path or source byte is changed.
- Copy new content to an immutable content-addressed pool under recurring/v1/. Read existing destination bytes back before reusing them. Original snapshot and control paths cannot be written by the recurring mode.
- Every run restores every file independently to isolated temporary files and compares SHA-256 hashes. A private manifest and success receipt are written/read back only after all checks pass.
- Emit aggregate logs only. No private paths, media, source inventory, signed URLs, tokens or keys are Actions artifacts.
- On failure, create/deduplicate an issue assigned to the existing owner alert recipient; a later verified success closes that issue. Healthy unchanged runs stay quiet.

## Bounds and limitations

Per snapshot: up to 1,000 objects, 5 GB total and 100 MB per object; job timeout 45 minutes. Unexpected buckets containing data, public sources, versioned/delete-marker objects, changed source identities, integrity failures or exceeded bounds stop the run rather than claiming partial coverage.

Production currently has 141 objects / 942,701,900 bytes; largest 26,432,818 bytes. The preview/development project is separate and is not included in this fixed production backup.

Content hashes deduplicate unchanged binary bytes between runs. Each snapshot still downloads source bytes and performs a full restore check. Existing provider usage/egress applies. No paid plan, new destination or deletion/retention rule is changed. Historical snapshots and content versions are not automatically pruned; storage grows when content changes.

GitHub schedule timing and notifications are best-effort, not an uptime SLA. The first real private-source copy/restore run and reporter status must pass before this is recorded as enabled and verified.

## Owner acceptance

The owner states: "I've tested everything on my own and it looks good" and approves the layout. Record this as owner-reported acceptance; do not invent a device/browser matrix or claim independent physical-device certification.
