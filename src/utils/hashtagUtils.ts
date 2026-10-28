const tagBody = /^[\p{L}\p{N}_][\p{L}\p{N}\p{M}_]{0,39}$/u;
export function normalizeHashtag(value: string): string | null {
  const tag = value.replace(/^#/, '');
  return tagBody.test(tag) ? tag.toLowerCase() : null;
}
export function hashtagParts(content: string): { text: string; tag?: string }[] {
  const parts: { text: string; tag?: string }[] = [];
  const expression = /(^|[^\p{L}\p{N}\p{M}_&#/])#([\p{L}\p{N}_][\p{L}\p{N}\p{M}_]{0,39})(?![\p{L}\p{N}\p{M}_])/gu;
  let cursor = 0;
  for (const match of content.matchAll(expression)) {
    const start = match.index! + match[1].length;
    if (start > cursor) parts.push({ text: content.slice(cursor, start) });
    parts.push({ text: '#' + match[2], tag: match[2].toLowerCase() });
    cursor = start + match[2].length + 1;
  }
  if (cursor < content.length) parts.push({ text: content.slice(cursor) });
  return parts;
}
export const extractHashtags = (content: string): string[] => [...new Set(hashtagParts(content).flatMap(p => p.tag ? [p.tag] : []))];
export function hashtagSearchExpression(value: string): string {
  const tag = normalizeHashtag(value);
  if (!tag) throw new Error('Choose a hashtag of 1–40 letters, numbers or underscores.');
  // The validated alphabet has no regular-expression syntax or PostgREST delimiters.
  return `(^|[^[:alnum:]_&#/])#${tag}([^[:alnum:]_]|$)`;
}
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
/** Retained for older callers; escape all untrusted text before returning markup. */
export const linkifyHashtags = (content: string): string => hashtagParts(content).map(part => part.tag
  ? `<a href="/hashtag/${encodeURIComponent(part.tag)}" class="text-gaming-400 hover:underline">${escapeHtml(part.text)}</a>`
  : escapeHtml(part.text)).join('');
