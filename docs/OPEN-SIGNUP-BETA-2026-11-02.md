# Verified self-service web beta

The owner requested that people can sign up and use CLIPT without manual approval. This supersedes the previous invitation-only admission decision. Signup notifications and a manual approval queue are no longer part of this task.

The existing Supabase email provider already allows signup and requires email confirmation (public settings: disable_signup=false, external.email=true, mailer_autoconfirm=false). Do not disable confirmation or password protections.

## Coordinated release
1. Test the exact source and `supabase/release/open-beta-access.sql`.
2. Install the additive SQL once, keeping `allow_verified_signups=false` until activation. The existing `enabled=true` boundary stays on.
3. Publish the tested UI: public signup route, persistent email-confirmation instructions, verified-session return to the feed, and account-access copy.
4. Activate with `UPDATE clipt_private.beta_access_config SET allow_verified_signups=true WHERE singleton AND enabled;`.
5. Verify anonymous denial, confirmed non-member admission, unconfirmed/banned/deleted/revoked denial, ownership, private media and enrolled MFA. No broad policy or table grants change.
6. Update the separate beta invitation page to explain signup → verify email → use CLIPT, without manual invitations.
7. Verify the public signup page and settings, and record the deployed commit and test results.

## Boundaries
- No membership row is required or manufactured for a verified ordinary account.
- An explicit membership revocation or expiry remains authoritative.
- Auth bans/deletion/confirmation/anonymous flags remain live database checks.
- Existing MFA, account/profile eligibility, moderation, blocks, content visibility and private Storage policies remain in force.
- Service workers, preflight and the admission RPC retain their existing narrow pre-request exemptions.
- Do not change VITE_BETA_ACCESS_REQUIRED to false or disable beta_access_config.enabled.
- Streaming and payments remain disabled. This does not grant moderator/admin access.
- Legacy release SQL is historical. Apply this follow-up after the earlier invitation/live-status scripts; do not reapply an older definition over it.

## Rollback
Set only `allow_verified_signups=false` on the existing singleton. Original explicit memberships remain intact; no posts, media, accounts or roles are deleted. Restore the prior UI deployment if needed. Keep email confirmation and the server admission boundary enabled.

## Testing limits
Local fixtures and SQL simulations do not prove real email delivery. Do not send a real signup email to an unapproved third-party address. Report manual inbox/device checks accurately.
