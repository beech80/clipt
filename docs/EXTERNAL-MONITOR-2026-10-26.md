# Independent production monitoring

The monitor runs on GitHub Actions outside CLIPT, Vercel and Supabase. It does not
depend on Matthew's Windows computer, an owner browser session or a paid add-on.
Standard hosted runners in this public repository are currently free. It checks
approximately every ten minutes, away from the top of the hour; scheduling can
be delayed or dropped and is not an uptime SLA.

## Checks and notifications

Six fixed, read-only checks cover login, privacy and terms HTML, Auth health,
an explicit anonymous beta-admission denial, and a denied anonymous table read.
The existing browser-public anon key is used; no service-role key, owner password
or customer session is needed. Each failed probe retries once after 1.5 seconds.
Requests have ten-second deadlines. Redirects fail rather than hiding a login or
protection error. This does not prove rendered playback or signed-in workflows.

The workflow can read repository contents and write issues only. A confirmed
failure creates one incident assigned to `beech80`. Repeated failures stay quiet.
Recovery closes only the monitor bot's incident and records the successful run.
Public issue bodies contain fixed check names, times and workflow links, not
private content, response bodies, exception text, headers or credentials.

The first healthy scheduled run creates one verification issue assigned to the
owner. It is deliberately not a fake outage. Confirm receipt and close it;
subsequent healthy runs do not recreate it. A GitHub issue receipt establishes
external alert creation, not email inbox delivery. The owner must verify email
notification settings and receipt before email delivery is marked complete.

## Operator steps

1. Open https://github.com/settings/notifications and enable email delivery for
   participating/assigned activity. Choose the intended verified email address;
   confirm `beecher@cliptgaming.com` if that is your notification destination.
2. Enable GitHub Actions failure notifications as a second path for monitor/job
   failures. Do not assume an email checkbox is already enabled.
3. Confirm receipt of the monitor's verification issue, then close it. No email
   address or account preference was silently changed by the implementation.
4. For an incident, inspect the linked run, assess scope, repair and verify. Keep
   invitation/payment restrictions enabled. Never make Storage public as a fix.

## Release safeguards

The remote default branch contained two old workflows that deployed the entire
application on any push. Their existing reviewed local replacements are manual
release holds. Publish those holds with the monitor so routine monitoring commits
cannot deploy stale application source. `vercel.json` additionally disables
automatic Git deployments while preserving framework, routing and headers.
Reviewed manual deployments remain available. No application source is changed
by this monitoring release.

## Tests and limits

Twelve isolated behavior tests cover successful probes, gate regressions,
transient failures, body redaction, initial verification, duplicate suppression,
recovery, issue ownership, invalid inputs and failed delivery receipts. No npm
install or application build is required to run this monitor or its tests.

GitHub can delay schedules; scheduled workflows in public repositories can be
disabled after 60 days without repository activity. Check the Actions page and
failure-notification settings regularly. This monitor cannot detect every browser
error, missed email or a GitHub outage. The in-app alert queue and five-minute
database watchdog remain separate. No new SMTP account, subscription or SMS
service was created. Production media privacy and the provider-owned pg_net
warning remain separate open release gates.

References:
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule
- https://docs.github.com/en/actions/concepts/billing-and-usage
- https://docs.github.com/en/actions/concepts/workflows-and-actions/notifications-for-workflow-runs
- https://vercel.com/docs/project-configuration/git-configuration
