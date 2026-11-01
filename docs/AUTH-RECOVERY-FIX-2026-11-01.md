# Authentication viewport and password recovery — November 1, 2026

[PR36](https://github.com/beech80/clipt/pull/36) merged as9afbf706d33c48e50128949a7f4afed5a66b12c8. Production deployment dpl_D8a58t47PU6fTgMaRWNW6EyXo8Dx is READY and owns the stable app alias. The previous web-beta deployment dpl_A4AxYytdYJFutv37ogBi7SZanjFq remains the frontend rollback target. No database, invitation, MFA, storage or payment-policy change was made.

## Screen-space correction

The reported sign-in screenshot showed a nested scroll surface: login reserved its own viewport height while the surrounding page also reserved controller padding. Auth routes now have a fitted visible-viewport shell and one form scroller ending at the measured controller edge. ResizeObserver and visualViewport events handle changes in controller height, browser chrome and keyboard size; listeners and animation frames are cleaned up. A callback ref also handles Auth/MFA gates attaching the shell after the initial render. Normal page/feed layouts keep their existing behavior and artwork.

The recovery link now sits beside the password field. A successful reset request stays on the recovery screen with an accessible account-neutral confirmation instead of immediately leaving for login. Request success does not claim mailbox delivery.

## Test evidence

[CI41317004504](https://github.com/beech80/clipt/actions/runs/41317004504) passed for exact source ede636afa22aa71f8e30931c412347d8cbe0a957:

-820 app tests and12 monitor tests, TypeScript, CSS, build and zero-vulnerability dependency checks.
-30 Chromium interaction cases and8 HTTPS media cases passed.
-WebKit:4 native-conversion/playback cases,18 channel/auth cases and3 repeated feed-transition cases passed.
-Seven new auth cases cover390x844,320x568,260x500 and844x390; no document overflow or gap at the fixed controller after error/scroll; reachable recovery controls; accepted and rate-limited recovery responses; normalized email/correct recovery redirect; and simulated keyboard viewport changes.

The first run exposed an overly strict test expectation about additional null PKCE metadata emitted by the SDK. The expectation was corrected while preserving email, redirect, request-count, success/error and geometry assertions. No failing layout behavior was waived. These tests use isolated local Auth fixtures and do not prove delivery of a real email or physical iPhone Safari behavior.

## Real recovery request and separate hosted template

The owner explicitly requested a reset for beecher@cliptgaming.com. The first production request returned HTTP200 and Auth recorded recovery_sent_at; the owner confirmed receiving the email but reported no button or linked words. The reviewed recovery.html provides both ConfirmationURL anchor and visible text fallback. Hosted Auth templates are separate from Vite deployment.

The owner confirmed saving the production Reset password template. One fresh request after that save returned HTTP200. Use only the newest email and do not share its token/URL. Visible-link/correct-destination/password-change acceptance still awaits the owner. Dashboard content was not independently read because browser connections were unavailable. If the new link opens another site, inspect the production Auth Site URL and exact /update-password redirect allow list; do not bypass token verification or MFA.

## Published browser verification and email follow-up

A fresh headless Edge browser opened the public production login at390x844, scrolled the form, clicked Forgot your password and reached /reset-password. Actual geometry was scrollY0, document height844, viewport height844, form bottom712 and controller top712: gap0. The produced portrait/recovery screenshots were visually inspected. This is real deployed-browser evidence, not physical Safari testing. The latest deployed JS assets also independently confirm production API/stage, required invitations and disabled checkout/readiness; public legal/login routes and catalog authorization probes passed again.

After the owner saved the email template, the fresh email arrived with a link, but the owner reported landing on a domain-connection page instead of CLIPT. This closes the missing-link symptom but not recovery completion. The production Auth Site URL and exact recovery redirect allow list must point to the stable Vercel app while custom-domain setup is deferred. The owner was given these exact settings: Site URL https://clipttest-matthew-beechers-projects.vercel.app and Redirect URL https://clipttest-matthew-beechers-projects.vercel.app/update-password. Saving these settings, requesting a new email and observing the actual password page remain pending at this checkpoint. Do not reuse or publish private recovery links.

## Redirect repair verified

The owner confirmed saving the production Auth Site URL and the exact /update-password redirect entry. A fresh read-only GET to the Auth verification endpoint using an intentionally invalid probe token returned303 with Location origin https://clipttest-matthew-beechers-projects.vercel.app and path /update-password. The expected destination matched. No valid token was used, no user's recovery link was consumed, and that probe sent no email. This independently verifies that Supabase accepts the correct recovery destination after the settings change.

One owner-authorized fresh recovery request after this check returned HTTP200; Auth recorded recovery_sent_at2026-11-01T15:06:21.94841Z. The owner should use that newest email to set a private password and sign in. Final password-change and signed-in app acceptance remain pending; no password or token was requested, retrieved or logged. Earlier unconnected-domain links should not be reused.

## Owner acceptance completed

The owner confirmed that the newest email opened the password page, a new private password was set, and sign-in to CLIPT succeeded. This closes the real email/link/password-change/sign-in acceptance for this repair. The password and recovery URL were never shared with or inspected by the agent. The separate final production clip/feed/comments/profile smoke check and explicit web-beta broadcasting scope are tracked in the beta handoff, not represented by this Auth pass.
