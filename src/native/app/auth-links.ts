/** Only this installed app's two PKCE callbacks may establish a native session. */
export const NATIVE_AUTH_SCHEME = 'com.slnjliheyiiummxhrgmk.clip';
export type AuthDestination = '/login' | '/update-password';

export function authRedirect(destination: AuthDestination, native: boolean, origin: string): string {
  if (!native) return `${origin}${destination}`;
  return `${NATIVE_AUTH_SCHEME}://auth/${destination === '/update-password' ? 'recovery' : 'confirm'}`;
}

function nativeCallbackUrl(value: string): URL | null {
  let url: URL;
  try { url = new URL(value); } catch { return null; }
  if (url.protocol !== `${NATIVE_AUTH_SCHEME}:` || url.hostname !== 'auth'
      || url.port || url.username || url.password
      || !['/confirm', '/recovery'].includes(url.pathname)) return null;
  return url;
}

export function parseNativeAuthLink(value: string): { code: string; destination: AuthDestination } | null {
  const url = nativeCallbackUrl(value);
  if (!url || url.hash) return null;
  const params = [...url.searchParams.keys()];
  if (params.length !== 1 || params[0] !== 'code') return null;
  const code = url.searchParams.get('code') ?? '';
  if (!/^[A-Za-z0-9_-]{16,256}$/.test(code)) return null;
  return { code, destination: url.pathname === '/recovery' ? '/update-password' : '/login' };
}

export function createAuthLinkConsumer(exchange: (code: string) => Promise<{ error: unknown }>,
  navigate: (path: AuthDestination) => void, failed: () => void) {
  const seen = new Set<string>();
  let reportedProviderError = false;
  let pending = Promise.resolve();
  return (value: string) => {
    const callback = nativeCallbackUrl(value);
    if (callback && (callback.searchParams.has('error') || new URLSearchParams(callback.hash.slice(1)).has('error'))) {
      // Expired links can carry provider errors instead of a code. Give generic
      // guidance, without displaying or retaining the URL/provider description.
      if (!reportedProviderError) { reportedProviderError = true; failed(); }
      return pending;
    }
    const link = parseNativeAuthLink(value);
    if (!link || seen.has(link.code)) return pending;
    if (seen.size >= 16) seen.delete(seen.values().next().value!);
    seen.add(link.code);
    pending = pending.then(async () => {
      try {
        const result = await exchange(link.code);
        if (result.error) throw new Error('Native callback failed');
        reportedProviderError = false;
        navigate(link.destination);
      } catch { failed(); }
    });
    return pending;
  };
}
