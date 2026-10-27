// Immediate UX feedback only. Database guards remain the security boundary;
// this finite text rule cannot detect every harmful meaning or spoken word.
export const COMMUNITY_TEXT_WARNING = 'Keep Clipt positive. Remove profanity, hateful language or abusive wording before sending. Your text has been kept so you can edit it.';

export function communityTextWarning(content: string): string | null {
  const substitutions: Record<string, string> = { '0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','@':'a','$':'s' };
  const text = content.normalize('NFKC').toLowerCase().replace(/[013457@$]/g, char => substitutions[char])
    .replace(/[\u200b-\u200d\ufeff]/g, '');
  const blocked = /(^|[^a-z])(fuck[a-z]*|shit[a-z]*|bitch[a-z]*|asshole[a-z]*|cunt[a-z]*|nigg(er|a)[a-z]*|kike[s]?|faggot[s]?)([^a-z]|$)/;
  const disguised = /(^|[^a-z])(f[^a-z]{0,3}u[^a-z]{0,3}c[^a-z]{0,3}k|s[^a-z]{0,3}h[^a-z]{0,3}i[^a-z]{0,3}t)([^a-z]|$)/;
  return blocked.test(text) || disguised.test(text) || /white\s+supremacy|heil\s+hitler/.test(text)
    ? COMMUNITY_TEXT_WARNING : null;
}

export function communityErrorMessage(error: unknown, fallback: string): string {
  const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : '';
  return /Clipt community rules/i.test(message) ? COMMUNITY_TEXT_WARNING : fallback;
}
