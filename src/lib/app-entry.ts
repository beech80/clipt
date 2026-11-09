/**
 * The welcome screen is presentation only: it never grants account or beta access.
 * A reload can retain entry in this tab; a new document navigation always welcomes.
 */
export const APP_ENTRY_KEY = 'clipt-app-entry-v1';

type EntryLocation = { pathname: string; search: string; hash: string };
const directPaths = new Set([
  '/reset-password', '/forgot-password', '/update-password', '/resend-verification',
  '/privacy', '/terms', '/docs/privacy-policy', '/docs/terms-of-service',
  '/delete-account', '/payment-success',
  '/docs/user-guide',
]);
const authParameters = ['code', 'token', 'token_hash', 'access_token', 'refresh_token',
  'error', 'error_code', 'error_description'];

export function isDirectEntry(location: EntryLocation): boolean {
  if (directPaths.has(location.pathname.replace(/\/$/, '') || '/')) return true;
  const query = new URLSearchParams(location.search);
  const fragment = new URLSearchParams(location.hash.replace(/^#/, ''));
  return authParameters.some(key => query.has(key) || fragment.has(key));
}

export function needsAppWelcome(location: EntryLocation, navigationType: string, entered: boolean): boolean {
  if (isDirectEntry(location)) return false;
  return !(navigationType === 'reload' && entered);
}

export function readAppEntry(): boolean {
  try { return sessionStorage.getItem(APP_ENTRY_KEY) === 'entered'; }
  catch { return false; }
}

export function rememberAppEntry(entered: boolean): void {
  try {
    if (entered) sessionStorage.setItem(APP_ENTRY_KEY, 'entered');
    else sessionStorage.removeItem(APP_ENTRY_KEY);
  } catch { /* Restricted storage must never prevent entering CLIPT. */ }
}
