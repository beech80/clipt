import { Share } from '@capacitor/share';
import { isNativeApp } from './runtime';
import { publicAppUrl } from '@/lib/public-app-url';

export async function shareClipt(input: { title: string; text?: string; url: string }): Promise<'shared' | 'copied'> {
  const value = { ...input, url: publicAppUrl(input.url, window.location.origin) };
  if (isNativeApp()) {
    await Share.share(value);
    return 'shared';
  }
  if (navigator.share) { await navigator.share(value); return 'shared'; }
  await navigator.clipboard.writeText(value.url);
  return 'copied';
}
