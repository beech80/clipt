export const PUBLIC_CLIPT_ORIGIN = 'https://clipttest-matthew-beechers-projects.vercel.app';

/** A native WebView's local origin is never a usable invitation or post link. */
export function publicAppUrl(path: string, origin: string, native = false): string {
  const base = new URL(origin);
  const url = new URL(path, base);
  const local = ['capacitor:', 'ionic:'].includes(url.protocol)
    || ['localhost', '127.0.0.1'].includes(url.hostname) && (native || base.protocol === 'capacitor:');
  if (local) return new URL(url.pathname + url.search + url.hash, PUBLIC_CLIPT_ORIGIN).href;
  if (!['https:', 'http:'].includes(url.protocol)) throw Error('This link cannot be shared.');
  return url.href;
}
