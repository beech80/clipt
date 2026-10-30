# Supabase pg_net review — October 30, 2026 UTC

Owner supplied Supabase's support reply for SU-526512. The provider confirms that pg_net grants are managed platform constraints; postgres cannot revoke grants issued by supabase_admin, and removing the required grants can break pg_cron/webhooks. The non-relocatable extension-placement warning is not claimed fixed or suppressed.

## Production checks actually run

Project slnjliheyiiummxhrgmk:

- Actual Data API profile probes for net, vault and clipt_private returned HTTP 406 / PGRST106 (Invalid schema). Only select=id&limit=0 was requested; no queue header, response content or Vault value was read.
- anon, authenticated and service_role have NOLOGIN.
- The listed login roles are provider/administrator roles. The CLI login role is expired (September 29, 2026). No new database login or password was created. Database credential holders still need to be trusted; this audit is not a claim about who may possess administrator credentials.
- Routine metadata found no application RPC in an exposed schema forwarding net HTTP calls or decrypted Vault secrets. The matching non-net built-ins were extensions.grant_pg_net_access (event_trigger) and vault.update_secret (not executable by browser roles).
- The http extension is not installed in production.
- All six media buckets remain private; current source is 141 objects / 942,701,900 bytes. Storage versioning is disabled.
- Managed pg_net remains in public, owned by supabase_admin and non-relocatable. The advisor remains WARN. No unsupported role escalation, extension recreation, queue RLS or ineffective REVOKE was attempted.

This closes the pending provider-clarification task as a documented supported configuration. It does not erase the managed warning or the provider's stated risk: credentials sent through pg_net are readable by database login roles. Keep direct database access limited to trusted operators/services and keep net/Vault private from the Data API.

The new backup path uses GitHub OIDC, a read/sign-only Edge worker and service-only metadata functions. Backblaze credentials stay in GitHub encrypted Secrets; the Supabase administrative key stays inside the Edge runtime. The backup does not send either credential through pg_net.

Sources:
- https://supabase.com/kb/troubleshooting/revoking-access-to-pg_net-objects-has-no-effect
- https://supabase.com/kb/troubleshooting/database-roles-can-read-request-headers-queued-by-pg_net
