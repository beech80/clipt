# CLIPT invite-only web beta — final photo acceptance, November 2, 2026

The remaining requested photo-moderation acceptance check passed. Within the owner's approved free, invite-only web scope, there is no remaining planned launch gate recorded by this review. Normal monitoring, moderation and backups continue during beta. This is not a zero-defect, legal, app-store, peak-load or comprehensive accessibility certification.

## Real signed-in photo and moderation test

The owner created a photo post through the existing app with caption “CLIPT beta photo test” and a hashtag. The stored JPEG was 622694 bytes in the private media bucket. Its moderation job entered the queue; no service credential was used to impersonate the owner's upload.

The actual worker processed the photo and caption successfully: two operations, scan state no_flag_detected, dispatch completed, is_published=true, moderation_hidden=false, no unresolved quarantine and no remaining review hold. Worker evidence: [run 41505994603](https://github.com/beech80/clipt/actions/runs/41505994603), job 125499355697, HTTP 200 / tick / processed.

The owner explicitly confirmed seeing the actual uploaded picture. The owner then opened the production moderation page and reported “No photo posts require review,” confirming the clean photo's expected queue state and usable moderator-page access. This is owner-reported phone acceptance plus independently observed backend processing; it is not an agent-controlled signed-in browser test. No manual decision was forced on an unflagged photo. Manual held-photo decision and authorization cases remain covered by the automated SQL/UI suite, rather than a claimed live flagged-photo decision.

## Azure activation and safeguards

Azure is enabled for eligible public photo posts and their captions. Videos remain manually moderated. The owner's moderator authenticator is verified. Provider verification passed with synthetic image/text inputs, and the first enabled worker tick persisted its heartbeat successfully.

The root cause of the original verification-recording failure was an UPDATE without a WHERE clause in a database function. The API role preloads safeupdate. [PR56](https://github.com/beech80/clipt/pull/56), merge 74224c547931029ecb5fdca3c0ac404e0852f865, scopes that singleton update and preserves the safeguard, service-only execution and activation guards. Production worker v7 contains the reviewed source.

Limits remain 100 attempted provider operations/day, 1000/month and 10/user/day. No paid Azure tier or payment feature was enabled. GitHub's configured five-minute schedule is best-effort; the observed successful test runs here were manually started/rerun. Media remains private, and credentials, signed media URLs and photo bytes are not included in this receipt.

## Current release and operational evidence

- [Run 41502935870](https://github.com/beech80/clipt/actions/runs/41502935870) passed all three CI jobs: 903 app tests, 12 monitor tests, type/CSS/build checks, zero-vulnerability npm audit, 53 Chromium UI checks, 8 private-media checks, and WebKit 4 codec / 41 UI / 3 repeated-playback checks.
- [Production monitor 41419569442](https://github.com/beech80/clipt/actions/runs/41419569442), latest job 125490815466, passed all six probes on their first attempt at 19:11 UTC: login, privacy, terms, Auth health, closed anonymous admission and unauthorized-data denial. Recovery was recorded and incident #50 is closed.
- [Backup and independent restore 41434994559](https://github.com/beech80/clipt/actions/runs/41434994559), snapshot 20261102-41434994559-1, verified 142 files / 948205598 bytes with matching restore, two ownerless files preserved and no production-file or bucket-privacy changes. Manifest SHA256 7558bf3775c5fbc1f0efecd99746de30c60f153b0d140e268ffe5316b6bc209b. This supersedes the November 1 deferred snapshot-verification note. The new photo test follows the ordinary backup schedule; this does not claim a snapshot includes future uploads.
- The Backblaze download cap remains the owner's chosen $0. Database and media backups remain separate.
- The provider-managed pg_net warning remains within its documented, accepted boundary; no unsupported extension-grant change was made.

## Beta scope

Login: https://clipttest-matthew-beechers-projects.vercel.app/login

Only explicitly approved invitees are admitted; signup alone does not approve a tester. Payments and production broadcasting remain disabled/deferred. Custom-domain work, native camera/screen broadcasting, Mac/Xcode acceptance and app-store distribution are separate deferred work, not new web-beta launch gates. Previously accepted owner tests of sign-in/recovery, video upload/playback, messaging and the existing controller experience remain recorded in the rollout history.

Keep alerts, backups and moderator review operational and fix issues reported by invited testers. Do not reopen accepted deferred scope merely to declare this beta finished.
