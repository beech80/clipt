# CLIPT web beta production rollout — November 1, 2026

## Current state

The owner approved completing the final production steps after clarifying that this beta is a web app. The reviewed web release is published. Final signed-in acceptance of the newly published production build is still awaiting the owner; no fresh upload/playback/browser pass is fabricated.

Stable beta login: https://clipttest-matthew-beechers-projects.vercel.app/login

Deployment dpl_A4AxYytdYJFutv37ogBi7SZanjFq is READY, target production, pinned to merged commit 8c301c9fdabbed95dbc30c5ee34b978193c26b60 from [PR35](https://github.com/beech80/clipt/pull/35). Its production and main aliases point to that deployment. The earlier deployment dpl_FJTC4fhNeUrPSrwfHfYtHTig4a8c is retained as the frontend rollback target. The source merge and rollout occurred October31; this report includes the subsequent November1 operational checks.

## Applied and verified

- Tracked production migration 20261031194900_beta_production_feature_contracts_20261031 succeeded on slnjliheyiiummxhrgmk. It installs private creator mutes, protected stream announcements, restrictive Squad visibility, posting capability checks and game-channel contracts.
- Both new tables have RLS and restrictive beta policies; both are registered for account erasure. Channel views use security_invoker=true and security_barrier=true. The Squad visibility rule remains restrictive. Browser reads of stream_key and stream_settings remain denied; game metadata writes have their reviewed column grant. Catalog importer execution remains denied to anon/authenticated and allowed to service_role.
- All22 physical game rows and all12 posts are preserved. The11 canonical channels group duplicate legacy titles without rewriting content IDs. Before/after game identity hash3d71385f5090af7c591e9482e05ae812, post/game hash5b1527b0b565d742db26f98cb5b8b284 and complete post-content hashb61291cae11f975f7f9b40e341bf2511 match. All141 media objects,942701900bytes and two ownerless objects are unchanged. All six buckets remain private.
- Production game-catalog version1 is ACTIVE. All four deployed files were read back and matched the reviewed source: index.ts, catalog.ts, wikidata.ts and _shared/request.ts. Gateway JWT verification is false deliberately; the shared application guard validates the user with Auth, enrolled MFA and the live invitation RPC before every search/import. Anonymous POST returns401 Authentication required; public status returns200/provider wikidata/configured true. This is not a claimed signed-in provider-search pass.
- The published browser bundle was independently fetched from the stable public alias. Its active configuration targets the production Supabase project, production stage, required invitations, checkout disabled and billing readiness disabled. Development-project constants can exist in bounded-pilot guards; the active VITE_SUPABASE_URL is production, not development. No private key was extracted or printed.
- Public login/privacy/terms returned200 with the app root. Six production monitor checks passed locally during rollout. The later [November1 independent monitor](https://github.com/beech80/clipt/actions/runs/41285036359) again passed login/privacy/terms/Auth health, closed anonymous beta admission and unauthorized data denial on the first attempt for every probe.
- [Exact merged-source validation](https://github.com/beech80/clipt/actions/runs/41235944062) passed820 app tests,12 monitor tests, type/CSS/build/audit checks, Chromium and WebKit. This is additional confirmation on the actual deployed source, not only the PR head.
- A read-only production RLS simulation under the approved owner identity returned admitted true, posting true,8 visible published posts,6 visible channel posts,11 game channels and empty valid mute/schedule results. It changed no rows and is not an Auth login or hosted-browser test.
- [November1 recurring private backup and independent restore](https://github.com/beech80/clipt/actions/runs/41297705441) succeeded: snapshot20261101-41297705441-1,141 copied/restored files,942701900bytes, two ownerless files preserved, productionFilesModified=false and bucketPrivacyChanged=false. Manifest SHA256922c2662b28122d023373cde13475a8cca81bd51ad241bbf15008b89b5de42c3; reporter healthy.
- [November1 native development cleanup](https://github.com/beech80/clipt/actions/runs/41304732322) succeeded. Native publishing remains separate from the web beta.
- Production security advisor still has no ERROR findings. The provider-documented managed pg_net placement warning remains; private service-only tables intentionally have no browser policies. No unsupported extension grant/placement change was attempted.

## Admission, operations and remaining owner check

Invite-only access is enabled. The sole active approved account is the confirmed beecher@cliptgaming.com owner, with existing moderator access. Existing accounts and newly created accounts are not admitted automatically. Do not disable the gate for troubleshooting or treat sending an Auth invitation as membership approval.

The owner should open the stable login above and perform one fresh upload/playback, comments and creator-profile check on this newly deployed version. Report the failing route/error if any; do not send passwords or tokens. The Opera connections respectively require reauthentication/are disconnected; two Windows Computer Use initialization attempts timed out and reset their kernel. Consequently no automated signed-in hosted pass was possible in this rollout.

To add testers, the owner supplies the exact approved email roster. Resolve each existing/new Auth account and explicitly approve only those identities through the private roster, preserving email confirmation and account-status checks. No new tester was added and no email invitation was sent by this release. If invitation/recovery emails redirect away from the stable app, review the production Auth Site URL and redirect allow list; their current dashboard configuration was not readable through the available connector. Do not claim invitation-link acceptance was exercised.

Support/moderation and external alert recipient remain beecher@cliptgaming.com. The owner previously confirmed receiving the real GitHub alert email. Keep monitoring, moderation and separate database/media backups running. No further payment or infrastructure purchase is required for the completed rollout itself.

## Streaming and deferred distribution

Payments are disabled. General production Mux broadcasting is not configured or enabled. The observed OBS success remains a bounded development-owner pilot, with extended stability unverified. Production stream announcements do not provision providers or confer LIVE status. Do not advertise unrestricted broadcasting or tell testers that development native readiness proves production streaming.

The owner deferred Mac/Xcode signing, native Camera Live/Screen Live physical acceptance, domain/DNS and App Store publication. A web browser cannot replace native screen-capture testing. See the existing iPhone first-test handoff when native work resumes. These deferred native/distribution items are separate from the published web beta; the unresolved production-broadcast scope remains explicit.

## Recovery and acceptance boundary

If the signed-in smoke test fails, investigate the specific production request and preserve user content. The previous frontend is a rollback option; retain successful migration data and restrictive policies, and fix forward rather than dropping new tables. Keep media private and do not restore over live storage merely to repeat a drill.

The release is live and its automated/operational checks passed. Final signed-in production acceptance and any additional tester admission are pending. No complete goal, legal/store certification, real native pass or zero-defect guarantee is asserted.
