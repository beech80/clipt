# Verified media backup and isolated restore — October 27, 2026

## Result

Completed snapshot `20261027-beta-initial` in the approved private Backblaze bucket `clipt-media-backup2026`.

- Source files: **141**; backed up: **141**; fully restored: **141**.
- Source, backup and restored byte count: **942,701,900**.
- Both ownerless files are preserved with their original metadata; no ownership was inferred.
- Every source file passed size and ETag checks. Each upload passed SHA-1 validation, and every downloaded backup was written to isolated temporary files and reread for SHA-256 comparison.
- The private manifest and completion receipt were also independently downloaded and hash checked.
- Manifest SHA-256: `a308214b9af823e48c196e2784e0f354f9aa38a4e679650b6d3b7c6b56e63118`.
- A fresh post-backup database inventory matches the pre-backup snapshot exactly.
- Anonymous HEAD access to a known backed-up object returned **401**; no media body was read in that check.
- Production objects, owner assignments, application deployment and source bucket privacy were not changed.

## Evidence

- Actual transfer and full restore: https://github.com/beech80/clipt/actions/runs/40608879235 (backup job 122555240552).
- Tested code/source: `341606a3f3925365af465f76a45c1f7685b78be1`.
- Runner review: https://github.com/beech80/clipt/pull/9 .
- Encrypted inventory review: https://github.com/beech80/clipt/pull/10 .
- Destination authentication/private-bucket verification: https://github.com/beech80/clipt/actions/runs/40598372523 .
- Transport-key bootstrap and read-back: https://github.com/beech80/clipt/actions/runs/40607909587 .
- **71 targeted tests passed** locally and in GitHub, covering crypto tampering, scope boundaries, private destination enforcement, HTTP/size/ETag failures, corrupted downloads/manifests, resumable writes and isolated disk restore.

## Recovery records and limits

The private bucket contains the full manifest and receipt under `snapshots/20261027-beta-initial/`, along with opaque numbered backup objects. The private manifest records original Storage object IDs, paths, owners, versions, timestamps and metadata, with destination file IDs and SHA-256 hashes. No plaintext source inventory, private key, original file paths or media are committed to GitHub or published as Actions artifacts.

The inventory passes through the public repository only as RSA-OAEP-SHA256 / AES-256-GCM ciphertext. Its transport private key is stored in the approved private bucket, not in source control. Uploads request SSE-B2 encryption. The runner obtains the existing bucket-restricted B2 credentials only from encrypted GitHub Secrets.

This is a verified **one-time snapshot**, not a recurring backup or an automatic guarantee covering future uploads. The workflow can be started manually; it retains the same frozen inventory and verifies existing destination bytes rather than silently overwriting them. The 200-file, 1-GB snapshot limit and 36-MB per-object limit are intentional. A refreshed encrypted inventory is necessary for a new snapshot. A private-source backup after cutover requires a separately authorized read path; the current source reader deliberately uses public GETs only.

The isolated restore test restored bytes and mapping metadata into ephemeral files; it did **not** overwrite a Supabase project. A production restore still requires a reviewed Storage API plan, mapping/authorization checks, and explicit destination selection. Do not edit Storage metadata to pretend files were restored.

At the published rate of $6.95/TB-month, this snapshot's storage is under $0.01/month before applicable free allowances. This is an estimate, not an account invoice; existing account usage and source egress affect actual charges. Pricing reference: https://www.backblaze.com/cloud-storage/pricing .

## Separate release issues

The private-media cutover is still open: account for the 51 legacy paths and review the two ownerless files before changing public bucket flags. Physical-device and remaining signed-in acceptance also remain.

The broader release audit newly flags the existing Workbox/PWA build chain's `deepmerge` dependency under https://github.com/advisories/GHSA-gcqx-w48m-w2h4 ; no published patched release is listed. Its failure remains visible and must not be described as a clean application release. The standalone backup runner uses Node built-ins, runs no npm install, and does not load that dependency. No forced PWA downgrade or audit suppression was applied.
