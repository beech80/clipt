# Independent production monitoring

## Verified setup — October 26, 2026

- Monitoring-only PR https://github.com/beech80/clipt/pull/4 merged as
  `c17e9ad4dbac9210b7eab522c71e49ec581cda78`.
- Scoped run-on-change trigger added in
  `236116310f8d86c3d1adcdc84b7ed9eb789fd7dc`; app auto-deploy protections checked
  before publication. Only changes to the monitor workflow, script or tests
  trigger this additional check.
- Actual GitHub run https://github.com/beech80/clipt/actions/runs/40441015072
  succeeded: 12 behavior tests and all six live production probes passed.
- The GitHub bot created https://github.com/beech80/clipt/issues/5, assigned to
  `beech80`. The owner confirmed receiving the corresponding email at the intended
  destination. The verification issue was then closed as completed.
- This establishes actual external alert creation and owner-confirmed email
  receipt. It is not an independent inspection of inbox settings or a delivery SLA.
- The ten-minute schedule is registered ACTIVE. No schedule-triggered execution
  has been observed at this checkpoint; the proven run was triggered by a scoped
  code push. Do not claim timer execution was tested. GitHub can delay schedules.
- Production remains on `dpl_FJTC4fhNeUrPSrwfHfYtHTig4a8c`. No app build, database
  schema, media permissions or payment feature was changed by this monitor update.

### Separate repository CI discrepancy

The same push triggered the old main-branch application build, run
https://github.com/beech80/clipt/actions/runs/40441015098. It failed loading
`src/lib/api/posts`, imported by the old `CommentsPage.tsx`. This is not a monitor
failure or a failed production deployment. The reviewed production archive built
and passed its own tests separately; remote main is not yet that reviewed source.
Do not fix this by inventing a replacement API or copying the dirty worktree over
production. Source reconciliation/build repair is a separate known release task.
Narrow path filters now keep monitor-only maintenance in the independent monitor
workflow, while retaining application checks for actual application changes. This
does not claim the underlying main-branch application build was repaired or passed.

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
