import { Share } from '@capacitor/share';
import { isNativeApp } from './runtime';
import { publicAppUrl, PUBLIC_CLIPT_ORIGIN } from '@/lib/public-app-url';

export async function shareClipt(input: { title: string; text?: string; url: string }): Promise<'shared' | 'copied'> {
  const native = isNativeApp();
  // Some WebViews serialize their local origin as "null". Never use it as
  // the base of a shared link, or share Android's https://localhost address.
  const value = { ...input, url: publicAppUrl(input.url, native ? PUBLIC_CLIPT_ORIGIN : window.location.origin, native) };
  if (native) {
    await Share.share(value);
    return 'shared';
  }
  if (navigator.share) { await navigator.share(value); return 'shared'; }
  await navigator.clipboard.writeText(value.url);
  return 'copied';
}
