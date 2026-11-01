# Password recovery email

recovery.html is the reviewed HTML for the hosted project's Reset password email. Committing or deploying the Vite frontend does not apply this hosted Auth setting.

For production slnjliheyiiummxhrgmk, open https://supabase.com/dashboard/project/slnjliheyiiummxhrgmk/auth/templates, select Reset password, and replace only that template's Message body/source with recovery.html. Preserve other templates and mail-provider credentials. Save. The subject can be Reset your CLIPT password.

The ConfirmationURL placeholder must remain intact in both the clickable anchor and the text fallback. Do not substitute SiteURL alone: it does not verify a recovery token. Keep the stable app's /update-password URL in the Auth redirect allow list. Request a fresh email only after saving, and verify on the receiving device without sharing its private URL.

One owner-requested production reset was accepted (HTTP200) and recorded by Auth on November1; the owner received an email with no button or linked text. The actual hosted template could not be inspected through the connector because both browser connections were unavailable and no local management credential was available. The owner subsequently confirmed saving the Reset password template in the production dashboard. One fresh recovery request after that save returned HTTP200. The owner then corrected the Auth Site URL/recovery redirect; an invalid-token probe independently returned303 to the expected stable /update-password destination without consuming a real link. A fresh email request was accepted, and the owner confirmed changing the password and signing in. Recovery acceptance is complete for this repair; no credential value or recovery URL was retrieved.

Reference: https://supabase.com/docs/guides/auth/auth-email-templates
